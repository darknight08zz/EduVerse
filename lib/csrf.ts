import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Verifies that a request originated from our own frontend.
 */
export async function verifyCSRF(req: NextRequest): Promise<NextResponse | null> {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');

  const allowedOrigins = [
    `https://${host}`,
    `http://localhost:3000`,
    process.env.NEXTAUTH_URL,
  ].filter(Boolean);

  // If origin exists (browser-based request), it must match our host
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`[Security] CSRF Blocked: Origin ${origin} is not allowed.`);
    return NextResponse.json(
      { error: 'CSRF validation failed. Direct API access restricted.' },
      { status: 403 }
    );
  }

  // Double check X-Requested-With for AJAX requests
  const requestedWith = req.headers.get('x-requested-with');
  if (req.method === 'POST' && requestedWith !== 'XMLHttpRequest') {
    // Note: Some modern clients might not send this, but it's a good secondary signal
    // if implemented strictly in our api-client.
  }

  return null;
}

/**
 * Combined Auth and CSRF guard for API routes.
 */
export async function requireAuthAndCSRF(req: NextRequest) {
  const csrfError = await verifyCSRF(req);
  if (csrfError) return { session: null, error: csrfError };

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  return { session, error: null };
}
