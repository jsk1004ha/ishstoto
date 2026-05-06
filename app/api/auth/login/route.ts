import bcrypt from 'bcryptjs';
import { assertSameOrigin, handleRouteError, jsonOk, jsonError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { setSession } from '@/lib/session';
import { loginSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { loginId: body.loginId } });
    if (!user || user.role === 'BANNED') return jsonError('아이디 또는 비밀번호가 올바르지 않습니다.', 401);
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return jsonError('아이디 또는 비밀번호가 올바르지 않습니다.', 401);

    await setSession({
      userId: user.id,
      loginId: user.loginId,
      nickname: user.nickname,
      role: user.role,
      isAdmin: user.role === 'ADMIN'
    });

    return jsonOk({ userId: user.id, nickname: user.nickname, points: user.points, isAdmin: user.role === 'ADMIN' });
  } catch (error) {
    return handleRouteError(error);
  }
}
