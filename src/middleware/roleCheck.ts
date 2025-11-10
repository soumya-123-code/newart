import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 🔒 Static mock role (simulate Microsoft auth)
const user = {
  role: 'REVIEWER' as 'PREPARER' | 'REVIEWER' | 'DIRECTOR' | 'ADMIN',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔍 Middleware checking:', pathname);

  // ✅ IMPORTANT: Skip ALL public/logout/unauthorized routes immediately
  if (
    pathname === '/logout' ||
    pathname === '/unauthorized' ||
    pathname === '/login' ||
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')
  ) {
    console.log('✅ Public route - allowing:', pathname);
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === '/') {
    switch (user.role) {
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
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 🔒 Role-based route protection for dashboard routes
  if (pathname.startsWith('/dashboard/')) {
    if (
      pathname.startsWith('/dashboard/preparer') &&
      user.role !== 'PREPARER'
    ) {
      console.warn('❌ Unauthorized preparer access');
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (
      pathname.startsWith('/dashboard/reviewer') &&
      user.role !== 'REVIEWER'
    ) {
      console.warn('❌ Unauthorized reviewer access');
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (
      pathname.startsWith('/dashboard/director') &&
      user.role !== 'DIRECTOR'
    ) {
      console.warn('❌ Unauthorized director access');
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (pathname.startsWith('/dashboard/admin') && user.role !== 'ADMIN') {
      console.warn('❌ Unauthorized admin access');
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  console.log('✅ Middleware passed:', pathname);
  return NextResponse.next();
}

// ✅ SIMPLIFIED matcher - only match routes we care about
export const config = {
  matcher: [
    '/',
    '/logout',
    '/unauthorized',
    '/login',
    '/dashboard/:path*',
  ],
};
