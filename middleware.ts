// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    
    // Protect API routes
    if (!token && (req.nextUrl.pathname.startsWith('/api/gemini') || req.nextUrl.pathname.startsWith('/api/loan'))) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public paths
        const publicPaths = ['/', '/login', '/signup', '/api/auth'];
        if (publicPaths.some(p => pathname === p || pathname.startsWith('/api/auth'))) {
            return true;
        }

        // Static files
        if (pathname.includes('.') || pathname.startsWith('/_next')) {
            return true;
        }

        // Everything else requires auth
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
