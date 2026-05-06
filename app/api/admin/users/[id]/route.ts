import { z } from 'zod';
import { assertSameOrigin, handleRouteError, jsonOk, jsonError } from '@/lib/api';
import { nicknameSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

const sanctionSchema = z.object({
  nickname: nicknameSchema.optional(),
  role: z.enum(['USER', 'ADMIN', 'BANNED']).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const { id } = await params;
    const body = sanctionSchema.parse(await request.json());
    if (admin.id === id && body.role && body.role !== 'ADMIN') return jsonError('본인의 관리자 권한은 해제할 수 없습니다.', 422);
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id }, data: { nickname: body.nickname, role: body.role } });
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: 'USER_SANCTIONED', targetId: id, metadata: body } });
      return user;
    });
    return jsonOk({ id: updated.id, nickname: updated.nickname, role: updated.role });
  } catch (error) {
    return handleRouteError(error);
  }
}
