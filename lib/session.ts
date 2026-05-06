import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import type { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'ishs_toto_session';
const encoder = new TextEncoder();

export type SessionPayload = {
  userId?: string;
  loginId?: string;
  nickname?: string;
  role?: Role;
  isAdmin?: boolean;
  riroVerified?: boolean;
  realName?: string;
  studentNumber?: string;
  generation?: number;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET ?? 'dev-only-change-this-secret-32-characters';
  return encoder.encode(secret);
}

export async function signSession(payload: SessionPayload, maxAgeSeconds = 60 * 60 * 24 * 7) {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getSecret());
}

export async function setSession(payload: SessionPayload, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const jar = await cookies();
  const token = await signSession(payload, maxAgeSeconds);
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      loginId: true,
      nickname: true,
      role: true,
      points: true,
      createdAt: true,
      realName: true,
      studentNumber: true,
      generation: true
    }
  });
  if (!user || user.role === 'BANNED') return null;
  return { ...user, isAdmin: user.role === 'ADMIN' };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('AUTH_REQUIRED');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') throw new Error('ADMIN_REQUIRED');
  return user;
}
