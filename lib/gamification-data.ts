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
} as const;

export type ActionKey = keyof typeof XP_REWARDS;

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpRequired: number;
}

export const BADGES: Badge[] = [
  { id: 'first_step', name: 'First Step', description: 'Complete your profile', icon: '🚀', xpRequired: 100 },
  { id: 'explorer', name: 'University Explorer', description: 'Use Career Navigator', icon: '🗺️', xpRequired: 150 },
  { id: 'analyst', name: 'Financial Analyst', description: 'Complete ROI Calculator', icon: '📊', xpRequired: 200 },
  { id: 'strategist', name: 'Strategic Applicant', description: 'Use Admission Predictor', icon: '🎯', xpRequired: 250 },
  { id: 'loan_ready', name: 'Loan Ready', description: 'Complete Loan Assessment', icon: '💰', xpRequired: 400 },
  { id: 'power_user', name: 'Power User', description: 'Use all 5 modules', icon: '⚡', xpRequired: 500 },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day streak', icon: '🔥', xpRequired: 300 },
  { id: 'streak_30', name: 'Committed', description: '30-day streak', icon: '💎', xpRequired: 1000 },
];

export interface LevelInfo {
  level: number;
  title: string;
  nextLevelXP: number;
  percent: number;
}

export function calculateLevel(xp: number): LevelInfo {
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

export function calculateNewStreak(lastActive: string | null): number {
  if (!lastActive) return 1;
  const last = new Date(lastActive);
  const today = new Date();
  
  const diffTime = Math.abs(today.getTime() - last.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return -1; // Same day
  if (diffDays === 2) return 1; // Consecutive day
  return 0; // Lost streak
}
