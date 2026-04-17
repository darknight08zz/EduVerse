import { getServiceSupabase } from './supabase-service';

const supabase = getServiceSupabase();

const LIMITS: Record<string, { maxCalls: number; windowMinutes: number }> = {
  'gemini/chat':      { maxCalls: 30, windowMinutes: 60 },
  'gemini/career':    { maxCalls: 10, windowMinutes: 60 },
  'gemini/roi':       { maxCalls: 10, windowMinutes: 60 },
  'gemini/admission': { maxCalls: 10, windowMinutes: 60 },
  'gemini/sop':       { maxCalls: 5,  windowMinutes: 60 },
  'gemini/daily':     { maxCalls: 24, windowMinutes: 1440 }, // Once per hour avg
};

export async function checkRateLimit(
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const limit = LIMITS[endpoint] || { maxCalls: 20, windowMinutes: 60 };
  const windowMs = limit.windowMinutes * 60 * 1000;
  const now = new Date();

  const { data, error } = await supabase
    .from('api_rate_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .single();

  if (error || !data) {
    // First call — create record
    await supabase.from('api_rate_limits').upsert({
      user_id: userId,
      endpoint,
      call_count: 1,
      window_start: now.toISOString()
    });
    return { allowed: true, remaining: limit.maxCalls - 1, resetAt: new Date(now.getTime() + windowMs) };
  }

  const windowStart = new Date(data.window_start);
  const windowExpired = now.getTime() - windowStart.getTime() > windowMs;

  if (windowExpired) {
    // Reset window
    await supabase.from('api_rate_limits').upsert({
      user_id: userId,
      endpoint,
      call_count: 1,
      window_start: now.toISOString()
    });
    return { allowed: true, remaining: limit.maxCalls - 1, resetAt: new Date(now.getTime() + windowMs) };
  }

  if (data.call_count >= limit.maxCalls) {
    const resetAt = new Date(windowStart.getTime() + windowMs);
    return { allowed: false, remaining: 0, resetAt };
  }

  // Increment count
  await supabase.from('api_rate_limits')
    .update({ call_count: data.call_count + 1 })
    .eq('user_id', userId)
    .eq('endpoint', endpoint);

  return {
    allowed: true,
    remaining: limit.maxCalls - data.call_count - 1,
    resetAt: new Date(windowStart.getTime() + windowMs)
  };
}
