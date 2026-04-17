import crypto from 'crypto';
import { supabase } from './supabase';

// TTL per endpoint — units in seconds
const CACHE_TTL: Record<string, number> = {
  career:     60 * 60 * 24 * 7,   // 7 days
  roi:        60 * 60 * 24 * 3,   // 3 days
  admission:  60 * 60 * 24 * 7,   // 7 days
  sop:        60 * 60 * 2,        // 2 hours
  deadline:   60 * 60 * 24,       // 1 day
};

/**
 * Creates a unique SHA-256 hash for an endpoint and its inputs.
 * Ensures consistent keys by sorting input object keys.
 */
export function makeCacheKey(endpoint: string, inputs: object): string {
  const sorted = JSON.stringify(inputs, Object.keys(inputs).sort());
  return crypto
    .createHash('sha256')
    .update(`${endpoint}:${sorted}`)
    .digest('hex');
}

/**
 * Retrieves a cached Gemini response if it exists and hasn't expired.
 */
export async function getCached(cacheKey: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('gemini_cache')
      .select('response_json, expires_at, hit_count')
      .eq('cache_key', cacheKey)
      .single();

    if (error || !data) return null;

    // Check expiration
    if (new Date(data.expires_at) < new Date()) {
      await supabase.from('gemini_cache').delete().eq('cache_key', cacheKey);
      return null;
    }

    // Async increment hit count
    supabase
      .from('gemini_cache')
      .update({ hit_count: (data.hit_count || 0) + 1 })
      .eq('cache_key', cacheKey)
      .then(() => {});

    return data.response_json;
  } catch (err) {
    console.warn('[Cache] Fetch error:', err);
    return null;
  }
}

/**
 * Stores a Gemini response in the cache with a predefined TTL.
 */
export async function setCached(
  cacheKey: string,
  endpoint: string,
  response: string
): Promise<void> {
  const ttlSeconds = CACHE_TTL[endpoint] ?? 3600;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  try {
    await supabase.from('gemini_cache').upsert({
      cache_key: cacheKey,
      endpoint,
      response_json: response,
      expires_at: expiresAt,
      hit_count: 0,
    });
  } catch (err) {
    console.warn('[Cache] Write failure:', err);
  }
}
