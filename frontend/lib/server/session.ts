import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import type { UserRole } from '../types/api';

export const SESSION_COOKIE = 'cupo_session';

export interface Session {
  token: string;
  userId: string;
  role: UserRole;
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no está configurado en el frontend');
  return new TextEncoder().encode(secret);
}

export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      token,
      userId: payload.sub as string,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
});

export async function requireSession(redirectTo = '/login'): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect(redirectTo);
  }
  return session;
}

export async function requireRole(role: UserRole, fallback = '/'): Promise<Session> {
  const session = await requireSession();
  if (session.role !== role) {
    redirect(fallback);
  }
  return session;
}
