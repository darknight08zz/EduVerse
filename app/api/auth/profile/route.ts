import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-service';

/**
 * Secure endpoint to create or update a user profile using the service role.
 * This ensures that the SUPABASE_SERVICE_ROLE_KEY is never exposed to the client.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, name' },
        { status: 400 }
      );
    }

    const serviceSupabase = getServiceSupabase();
    
    const { error } = await serviceSupabase.from('user_profiles').upsert({
      id: userId,
      name: name,
      xp_points: 0,
      streak_days: 1,
      last_active: new Date().toISOString(),
      onboarding_complete: false
    });

    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('API Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
