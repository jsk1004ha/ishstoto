import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { assertSameOrigin, handleRouteError, jsonOk, jsonError } from '@/lib/api';
import { INITIAL_POINTS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { getSession, setSession } from '@/lib/session';
import { registerSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const verified = await getSession();
    if (!verified?.riroVerified || !verified.realName || !verified.studentNumber || !verified.generation) {
      return jsonError('리로스쿨 본인인증을 먼저 완료해 주세요.', 403);
    }

    const body = registerSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          loginId: body.loginId,
          passwordHash,
          nickname: body.nickname,
          realName: verified.realName!,
          studentNumber: verified.studentNumber!,
          generation: verified.generation!,
          role: verified.role === 'ADMIN' ? 'ADMIN' : 'USER',
          points: INITIAL_POINTS
        }
      });
      await tx.pointLedger.create({
        data: {
          userId: created.id,
          type: 'INITIAL_GRANT',
          amount: INITIAL_POINTS,
          balanceAfter: INITIAL_POINTS,
          reason: '회원가입 초기 포인트 지급'
        }
      });
      return created;
    });

    await setSession({
      userId: user.id,
      loginId: user.loginId,
      nickname: user.nickname,
      role: user.role,
      isAdmin: user.role === 'ADMIN'
    });

    return jsonOk({ userId: user.id, nickname: user.nickname, points: user.points });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return jsonError('이미 사용 중인 아이디 또는 닉네임입니다.', 409);
    }
    return handleRouteError(error);
  }
}
