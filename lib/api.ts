import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError('입력값을 확인해 주세요.', 422, error.flatten());
  }
  if (error instanceof Error) {
    if (error.message === 'AUTH_REQUIRED') return jsonError('로그인이 필요합니다.', 401);
    if (error.message === 'ADMIN_REQUIRED') return jsonError('관리자 권한이 필요합니다.', 403);
    if (error.message.startsWith('PUBLIC:')) return jsonError(error.message.replace('PUBLIC:', ''), 400);
  }
  console.error(error);
  return jsonError('요청 처리 중 오류가 발생했습니다.', 500);
}

export function assertSameOrigin(request: Request) {
  const method = request.method.toUpperCase();
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) return;
  const origin = request.headers.get('origin');
  if (!origin) return;
  const host = request.headers.get('host');
  if (!host) return;
  const expected = new URL(request.url);
  if (new URL(origin).host !== host && new URL(origin).host !== expected.host) {
    throw new Error('PUBLIC:잘못된 요청 출처입니다. 새로고침 후 다시 시도해 주세요.');
  }
}
