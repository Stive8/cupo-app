import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'cupo_session';

const ROLE_PREFIXES: { prefix: string; role: 'business_owner' | 'customer' }[] = [
  { prefix: '/panel', role: 'business_owner' },
  { prefix: '/reservas', role: 'customer' },
  { prefix: '/reservar', role: 'customer' },
];

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? '');
}

function redirectToLogin(request: NextRequest) {
  const url = new URL('/login', request.url);
  url.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const match = ROLE_PREFIXES.find((entry) => request.nextUrl.pathname.startsWith(entry.prefix));
  if (!match) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return redirectToLogin(request);

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== match.role) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch {
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/panel/:path*', '/reservas/:path*', '/reservar/:path*'],
};
