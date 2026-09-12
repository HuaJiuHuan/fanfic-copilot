import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/project', '/api/generate-scene', '/api/auth/signout'];

const publicRoutes = ['/login', '/register'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const isProtected = protectedRoutes.some(
    (route) => pathname.startsWith(route) || pathname === route,
  );

  if (isProtected) {
    const hasSession = request.cookies.get('authjs.session-token');
    const hasAuthCookie = request.cookies.has('__Secure-authjs.session-token') || hasSession;

    if (!hasAuthCookie) {
      const signInUrl = new URL('/login', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/project/:path*', '/api/generate-scene/:path*', '/login', '/register'],
};
