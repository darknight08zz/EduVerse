import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini, parseGeminiJSON } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    
    // 1. Fetch User Lifecycle Context
    const [profileRes, usageRes, shortlistRes] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', userId).single(),
      supabase.from('tool_usage').select('*').eq('user_id', userId),
      supabase.from('university_shortlist').select('*').eq('user_id', userId)
    ]);
    
    const profile = profileRes.data;
    const usage = usageRes.data || [];
    const shortlist = shortlistRes.data || [];
    
    const upcomingDeadlines = shortlist.filter(u => {
      if (!u.application_deadline) return false;
      const days = Math.ceil((new Date(u.application_deadline).getTime() - Date.now()) / 86400000);
      return days > 0 && days < 45; // Look ahead 45 days
    });
    
    const context = `
Profile: ${profile?.name || 'Scholar'}, ${profile?.current_degree || 'unspecified degree'}, Targets: ${profile?.target_countries?.join(', ') || 'Global'}
Tools Used: ${usage.map(u => u.tool_name).join(', ') || 'None'}
Shortlist Count: ${shortlist.length} universities
Upcoming Deadlines: ${upcomingDeadlines.map(u => `${u.university_name} (${Math.ceil((new Date(u.application_deadline!).getTime() - Date.now()) / 86400000)} days)`).join(', ') || 'None'}
Stats: ${profile?.xp_points || 0} XP, ${profile?.streak_days || 1}-day Streak
    `;
    
    const prompt = `You are the EduVerse Personality Agent. Based on this student's context, generate a personalized dashboard briefing.
Context: ${context}

Goal: Provide 1 friendly greeting and 3 prioritized, hyper-specific next actions to move them closer to enrollment.

Respond ONLY with this JSON:
{
  "greeting": "Personalized 1-sentence hook",
  "urgencyLevel": "low" | "medium" | "high",
  "nextActions": [
    {
      "action": "Specific task",
      "module": "career_navigator" | "roi_calculator" | "admission_predictor" | "loan_estimator" | "sop_copilot" | "shortlist",
      "urgency": "low" | "medium" | "high",
      "reason": "Why this now?"
    }
  ]
}`;

    const result = await generateWithGemini(prompt);
    const data = parseGeminiJSON(result);

    return NextResponse.json(data || {
      greeting: `Welcome back, ${profile?.name || 'Scholar'}! Ready to level up your journey today?`,
      urgencyLevel: "medium",
      nextActions: [
        { action: "Complete your academic profile", module: "profile", urgency: "high", reason: "Foundation for all AI tools" }
      ]
    });

  } catch (err: unknown) {
    console.error("Agent Personalization Error:", err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Internal server error" 
    }, { status: 500 });
  }
}
