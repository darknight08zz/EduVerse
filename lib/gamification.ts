"use server";

import { getServiceSupabase } from "./supabase-service";
import { XP_REWARDS, ActionKey } from "./gamification-data";

export async function awardXP(userId: string, actionKey: ActionKey) {
  const points = XP_REWARDS[actionKey];
  
  // Update LocalStorage (This will fail on server, so we skip it or use a different mechanism)
  // But we want the client to know. Server Actions can't dispatch client events directly.
  // Instead, the calling component should handle the result.

  // 1. Update Supabase
  if (userId) {
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

  return points;
}

/**
 * Save result of a tool analysis to history
 */
export async function saveToolHistory(
  userId: string, 
  toolName: string, 
  inputs: Record<string, unknown>, 
  results: Record<string, unknown>
) {
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
export interface ProfileSyncData {
  gpa?: number;
  gre?: number;
  ielts?: number;
  budget?: number;
  degree?: string;
  field?: string;
  targetCountries?: string[];
}

export async function syncProfileData(userId: string, data: ProfileSyncData) {
  if (!userId) return;
  const serviceSupabase = getServiceSupabase();

  const updatePayload: Record<string, unknown> = {};
  if (data.gpa) updatePayload.gpa = data.gpa;
  if (data.gre) updatePayload.gre_score = data.gre;
  if (data.ielts) updatePayload.ielts_score = data.ielts;
  if (data.budget) updatePayload.budget_usd = data.budget;
  if (data.degree) updatePayload.current_degree = data.degree;
  if (data.field) updatePayload.target_programs = [data.field];
  if (data.targetCountries) updatePayload.target_countries = data.targetCountries;

  if (Object.keys(updatePayload).length > 0) {
    return await serviceSupabase.from('user_profiles')
      .update(updatePayload)
      .eq('id', userId);
  }
}
