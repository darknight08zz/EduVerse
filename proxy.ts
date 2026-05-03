import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const publicPaths = ['/', '/login', '/signup', '/blog'];

function isPublic(pathname: string): boolean {
  // Always allow NextAuth API routes through — they handle their own auth
  if (pathname.startsWith('/api/auth')) return true;
  // Allow static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.includes('.')) return true;
  // Allow explicitly public paths
  if (publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) return true;
  return false;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always pass public/auth paths straight through
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check for a NextAuth session cookie (works for both dev and prod cookie names)
  const sessionToken =
    req.cookies.get('next-auth.session-token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!sessionToken) {
    // Protect API routes — return 401 instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    // Redirect other protected pages to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
