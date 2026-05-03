import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { awardXP } from '@/lib/gamification';
import { ActionKey } from '@/lib/gamification-data';
import { getServiceSupabase } from '@/lib/supabase-service';

/**
 * API route to award XP points to a user.
 * Falls back to Supabase session when NextAuth session is not yet available
 * (e.g. right after signup before full NextAuth session is established).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { actionKey, userId: bodyUserId } = body;

    if (!actionKey) {
      return NextResponse.json({ error: 'Missing actionKey' }, { status: 400 });
    }

    // 1. Try NextAuth session first
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    // 2. Fall back to Supabase session (for users right after signup)
    if (!userId) {
      const serviceSupabase = getServiceSupabase();
      // If caller passed userId explicitly (trusted server call), use it
      if (bodyUserId) {
        userId = bodyUserId;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const points = await awardXP(userId, actionKey as ActionKey);
    return NextResponse.json({ success: true, points });
  } catch (err: unknown) {
    console.error('Gamification API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
