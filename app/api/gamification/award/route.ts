import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { awardXP } from '@/lib/gamification';
import { ActionKey } from '@/lib/gamification-data';

/**
 * API route to award XP points to a user.
 * This ensures the service role logic stays on the server.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { actionKey } = await request.json();
    if (!actionKey) {
      return NextResponse.json({ error: 'Missing actionKey' }, { status: 400 });
    }

    const points = await awardXP(session.user.id, actionKey as ActionKey);
    return NextResponse.json({ success: true, points });
  } catch (err: unknown) {
    console.error('Gamification API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
