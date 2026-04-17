import { NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Find users inactive for 2-5 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    const { data: inactiveUsers, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, name, xp_points, target_countries, target_programs')
      .lt('updated_at', twoDaysAgo)
      .gt('updated_at', fiveDaysAgo)
      .limit(20); // Limit to avoid hitting rate limits in one go

    if (fetchError) throw fetchError;

    const results = [];

    for (const user of (inactiveUsers || [])) {
      // 2. Identify missing milestones
      const { data: usage } = await supabase
        .from('tool_usage')
        .select('tool_name')
        .eq('user_id', user.id);
      
      const usedTools = new Set(usage?.map(u => u.tool_name) || []);
      const allTools = [
        { id: 'career_navigator', label: 'Career Navigator' },
        { id: 'roi_calculator', label: 'ROI Calculator' },
        { id: 'admission_predictor', label: 'Admission Predictor' },
        { id: 'loan_estimator', label: 'Loan Estimator' },
        { id: 'sop_copilot', label: 'SOP Copilot' }
      ];
      
      const unusedTools = allTools.filter(t => !usedTools.has(t.id));
      
      if (unusedTools.length === 0) continue;
      
      // 3. Generate personalized nudge
      const targetTool = unusedTools[0];
      const nudgePrompt = `You are the EduVerse AI Nudge Agent. 
Student: ${user.name}
Target Countries: ${user.target_countries?.join(', ') || 'Global'}
Missing Milestone: ${targetTool.label}

Generate a short, high-urgency, emoji-free nudge message (max 100 chars) to get them back. 
Focus on why "${targetTool.label}" is critical for their ${user.target_programs?.[0] || 'Master\'s'} journey. 
Be helpful but firm. No generic fluff.`;
      
      const nudgeText = await generateWithGemini(nudgePrompt);
      
      // 4. Save nudge to notifications
      await supabase.from('user_notifications').insert({
        user_id: user.id,
        message: nudgeText.trim().replace(/^"(.*)"$/, '$1').slice(0, 100),
        type: 'nudge',
        module: targetTool.id,
        read: false
      });

      results.push({ user: user.name, module: targetTool.id });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `AI Nudge Agent: Sent ${results.length} nudges`,
      details: results 
    });

  } catch (err: any) {
    console.error("Agent Nudge Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
