import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes immediately
  if (
    pathname === '/logout' ||
    pathname === '/unauthorized' ||
    pathname === '/login' ||
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // Get user data from cookie (set by client-side auth)
  const userCookie = request.cookies.get('user');
  const authCookie = request.cookies.get('isAuthenticated');

  // If no auth cookie, redirect to home
  if (!authCookie || authCookie.value !== 'true') {
    if (pathname.startsWith('/dashboard/')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Parse user data from cookie
  let user;
  try {
    if (userCookie) {
      user = JSON.parse(userCookie.value);
    }
  } catch (error) {
    // Invalid cookie data
    if (pathname.startsWith('/dashboard/')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // If we have a user, check their current role
  const currentRole = user?.currentRole || user?.roles?.split(',')[0];

  // Root redirect based on role
  if (pathname === '/') {
    if (!currentRole) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    switch (currentRole.toUpperCase()) {
      case 'PREPARER':
        return NextResponse.redirect(
          new URL('/dashboard/preparer/my-reconciliations', request.url)
        );
      case 'REVIEWER':
        return NextResponse.redirect(
          new URL('/dashboard/reviewer/all-reconciliations', request.url)
        );
      case 'DIRECTOR':
        return NextResponse.redirect(
          new URL('/dashboard/director/current-period', request.url)
        );
      case 'ADMIN':
        return NextResponse.redirect(
          new URL('/dashboard/admin/dashboard', request.url)
        );
      default:
        return NextResponse.next();
    }
  }

  // Role-based route protection for dashboard routes
  if (pathname.startsWith('/dashboard/') && currentRole) {
    const role = currentRole.toUpperCase();
    const roles = user?.roles?.split(',').map((r: string) => r.trim().toUpperCase()) || [role];

    if (
      pathname.startsWith('/dashboard/preparer') &&
      !roles.includes('PREPARER') &&
      !roles.includes('ADMIN')
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (
      pathname.startsWith('/dashboard/reviewer') &&
      !roles.includes('REVIEWER') &&
      !roles.includes('ADMIN')
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (
      pathname.startsWith('/dashboard/director') &&
      !roles.includes('DIRECTOR') &&
      !roles.includes('ADMIN')
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (pathname.startsWith('/dashboard/admin') && !roles.includes('ADMIN')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/logout',
    '/unauthorized',
    '/login',
    '/dashboard/:path*',
  ],
};
