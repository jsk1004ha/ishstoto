import { assertSameOrigin, handleRouteError, jsonOk, jsonError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { adminAdjustPointsSchema } from '@/lib/validation';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const { id } = await params;
    const body = adminAdjustPointsSchema.parse({ ...(await request.json()), userId: id });
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return jsonError('사용자를 찾을 수 없습니다.', 404);
    if (user.points + body.amount < 0) return jsonError('조정 후 포인트가 음수가 될 수 없습니다.', 422);

    const updated = await prisma.$transaction(async (tx) => {
      const changed = await tx.user.update({ where: { id }, data: { points: { increment: body.amount } } });
      await tx.pointLedger.create({ data: { userId: id, type: 'ADMIN_ADJUST', amount: body.amount, balanceAfter: changed.points, reason: body.reason } });
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: 'POINT_ADJUSTED', targetId: id, metadata: { amount: body.amount, reason: body.reason } } });
      return changed;
    });
    return jsonOk({ id: updated.id, points: updated.points });
  } catch (error) {
    return handleRouteError(error);
  }
}
