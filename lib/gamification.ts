import { supabase, getServiceSupabase } from "./supabase";

export const XP_REWARDS = {
  PROFILE_COMPLETE: 100,
  CAREER_NAVIGATOR: 50,
  ROI_CALCULATOR: 40,
  ADMISSION_PREDICTOR: 35,
  MENTOR_CHAT_START: 10,
  MENTOR_CHAT_PER_5_MESSAGES: 15,
  LOAN_ESTIMATOR_ASSESSMENT: 60,
  LOAN_ESTIMATOR_COMPARISON: 20,
  DOCUMENT_CHECKLIST_80: 50,
  DAILY_LOGIN: 20,
  STREAK_7_DAYS: 100,
  STREAK_30_DAYS: 500,
  REFERRAL: 200,
  SHORTLIST_UNIVERSITY: 15,
  APPLIED_UNIVERSITY: 75,
  ACCEPTED_ADMIT: 200,
  WRITER: 100,
  PROLIFIC_WRITER: 75,
  STRONG_APPLICANT: 50,
};

export const BADGES = [
  { id: 'first_step', name: 'First Step', description: 'Complete your profile', icon: '🚀', xpRequired: 100 },
  { id: 'explorer', name: 'University Explorer', description: 'Use Career Navigator', icon: '🗺️', xpRequired: 150 },
  { id: 'analyst', name: 'Financial Analyst', description: 'Complete ROI Calculator', icon: '📊', xpRequired: 200 },
  { id: 'strategist', name: 'Strategic Applicant', description: 'Use Admission Predictor', icon: '🎯', xpRequired: 250 },
  { id: 'loan_ready', name: 'Loan Ready', description: 'Complete Loan Assessment', icon: '💰', xpRequired: 400 },
  { id: 'power_user', name: 'Power User', description: 'Use all 5 modules', icon: '⚡', xpRequired: 500 },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day streak', icon: '🔥', xpRequired: 300 },
  { id: 'streak_30', name: 'Committed', description: '30-day streak', icon: '💎', xpRequired: 1000 },
];

export function calculateLevel(xp: number): { level: number; title: string; nextLevelXP: number; percent: number } {
  const levels = [
    { xp: 0, level: 1, title: 'Explorer' },
    { xp: 200, level: 2, title: 'Researcher' },
    { xp: 500, level: 3, title: 'Applicant' },
    { xp: 1000, level: 4, title: 'Scholar' },
    { xp: 2500, level: 5, title: 'Global Student' },
  ];
  const current = levels.filter(l => xp >= l.xp).pop()!;
  const next = levels.find(l => l.xp > xp);
  
  const range = next ? next.xp - current.xp : 1000;
  const progress = next ? xp - current.xp : 0;
  const percent = next ? (progress / range) * 100 : 100;

  return { 
    level: current.level, 
    title: current.title, 
    nextLevelXP: next?.xp || 9999,
    percent
  };
}

export async function awardXP(userId: string, actionKey: keyof typeof XP_REWARDS) {
  const points = XP_REWARDS[actionKey];
  
  // 1. Update LocalStorage for instant UI feedback
  if (typeof window !== 'undefined') {
    const localXp = parseInt(localStorage.getItem('eduverse_xp') || '0');
    localStorage.setItem('eduverse_xp', (localXp + points).toString());
  }

  // 2. Update Supabase
  if (userId) {
    // Use service role for critical persistence to ensure it succeeds regardless of RLS timing
    const serviceSupabase = getServiceSupabase();
    
    // Increment XP in profile
    const { data: profile } = await serviceSupabase.from('user_profiles').select('xp_points').eq('id', userId).single();
    const currentXp = profile?.xp_points || 0;
    
    await serviceSupabase.from('user_profiles')
      .update({ xp_points: currentXp + points, last_active: new Date().toISOString() })
      .eq('id', userId);
    
    // Log tool usage for recent activity feed
    await serviceSupabase.from('tool_usage').insert({
      user_id: userId,
      tool_name: actionKey,
      xp_earned: points
    });
  }

  // Trigger global event for UI updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xp_earned', { detail: { points, action: actionKey } }));
  }
  return points;
}

/**
 * Save result of a tool analysis to history
 */
export async function saveToolHistory(userId: string, toolName: string, inputs: any, results: any) {
  if (!userId) return;
  const serviceSupabase = getServiceSupabase();
  
  return await serviceSupabase.from('tool_history').insert({
    user_id: userId,
    tool_name: toolName,
    inputs,
    results
  });
}

/**
 * Intelligently sync profile data from tool inputs
 */
export async function syncProfileData(userId: string, data: Partial<{
  gpa: number,
  gre: number,
  ielts: number,
  budget: number,
  degree: string,
  field: string,
  targetCountries: string[]
}>) {
  if (!userId) return;
  const serviceSupabase = getServiceSupabase();

  const updatePayload: any = {};
  if (data.gpa) updatePayload.gpa = data.gpa;
  if (data.gre) updatePayload.gre_score = data.gre;
  if (data.ielts) updatePayload.ielts_score = data.ielts;
  if (data.budget) updatePayload.budget_usd = data.budget;
  if (data.degree) updatePayload.current_degree = data.degree;
  if (data.field) updatePayload.target_programs = [data.field]; // Assuming primary field
  if (data.targetCountries) updatePayload.target_countries = data.targetCountries;

  if (Object.keys(updatePayload).length > 0) {
    return await serviceSupabase.from('user_profiles')
      .update(updatePayload)
      .eq('id', userId);
  }
}

export function calculateNewStreak(lastActive: string | null): number {
  if (!lastActive) return 1;
  const last = new Date(lastActive);
  const today = new Date();
  
  const diffTime = Math.abs(today.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return -1; // Same day (should technically be handled by not updating)
  if (diffDays === 2) return 1; // Consecutive day (yesterday)
  return 0; // Lost streak
}
