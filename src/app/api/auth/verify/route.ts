
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/server';

export async function GET(request: NextRequest) {
  const sessionCookieName = 'codealchemist-session';
  const cookie = request.cookies.get(sessionCookieName);

  if (!cookie?.value) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }

  try {
    const { auth } = getFirebaseAdmin();
    await auth.verifySessionCookie(cookie.value, true);
    return NextResponse.json({ isAuthenticated: true }, { status: 200 });
  } catch (error) {
    // Session cookie is invalid or expired.
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }
}
