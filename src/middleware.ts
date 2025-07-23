
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  // The matcher is configured to run middleware on all routes except for
  // public assets, the login page, the signup page, and the auth API routes.
  // This ensures that authentication is checked for all protected pages.
  matcher: [
    '/((?!api/auth/verify|login|signup|_next/static|_next/image|favicon.ico).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const sessionCookieName = 'codealchemist-session';
  const cookie = request.cookies.get(sessionCookieName);

  // The absolute URL is required for the fetch request to the API route.
  const verifyUrl = new URL('/api/auth/verify', request.url);

  // If there's no session cookie, redirect to the login page immediately.
  if (!cookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Call the internal API route to verify the session cookie.
    // We pass the cookie value in the headers for verification.
    const response = await fetch(verifyUrl.toString(), {
      headers: {
        Cookie: `${sessionCookieName}=${cookie.value}`,
      },
    });

    const { isAuthenticated } = await response.json();

    // If the session is not valid, redirect to the login page.
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // If the session is valid, allow the request to proceed.
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware verification error:', error);
    // In case of an error during verification, it's safer to redirect to login.
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
