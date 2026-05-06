import { assertSameOrigin, handleRouteError, jsonOk, jsonError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { resultSchema } from '@/lib/validation';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const { id } = await params;
    const body = resultSchema.parse(await request.json());
    const match = await prisma.match.findUnique({ where: { id }, include: { options: true } });
    if (!match) return jsonError('경기를 찾을 수 없습니다.', 404);
    if (match.settledAt) return jsonError('이미 정산된 경기입니다.', 409);
    if (!match.options.some((option) => option.id === body.resultOptionId)) return jsonError('경기 선택지가 아닙니다.', 422);

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.match.update({ where: { id }, data: { resultOptionId: body.resultOptionId, status: 'RESULTED' }, include: { options: true } });
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: 'MATCH_RESULT_SET', matchId: id, metadata: body } });
      return result;
    });
    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}
