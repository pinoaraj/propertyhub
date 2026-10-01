import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const isOnLogin = req.nextUrl.pathname.startsWith('/login');
  const isOnRegister = req.nextUrl.pathname.startsWith('/register');
  const isOnApiAuth = req.nextUrl.pathname.startsWith('/api/auth');
  const isOnApi = req.nextUrl.pathname.startsWith('/api/');

  // Allow API routes to pass through
  if (isOnApiAuth || isOnApi) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated and trying to access dashboard
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Redirect to dashboard if logged in and trying to access login/register
  if ((isOnLogin || isOnRegister) && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};