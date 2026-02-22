import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Skip authentication for certain paths (login page/API, static assets, Next internals)
const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // if no password defined, skip authentication entirely
  if (!process.env.AUTH_PASSWORD) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('auth')?.value;
  if (authCookie === 'true') {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

// apply middleware to everything except common public files
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
