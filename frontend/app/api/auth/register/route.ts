import { NextResponse } from 'next/server';
import { apiFetch, ApiError } from '@/lib/server/api';
import { SESSION_COOKIE } from '@/lib/server/session';
import type { LoginResult } from '@/lib/types/api';

export async function POST(request: Request) {
  const body = await request.json();

  try {
    await apiFetch('/auth/register', { method: 'POST', body });
    const result = await apiFetch<LoginResult>('/auth/login', {
      method: 'POST',
      body: { email: body.email, password: body.password },
    });

    const response = NextResponse.json({ success: true, user: result.user });
    response.cookies.set(SESSION_COOKIE, result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, message: 'Error inesperado' }, { status: 500 });
  }
}
