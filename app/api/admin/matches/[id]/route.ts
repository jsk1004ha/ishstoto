import { assertSameOrigin, handleRouteError, jsonOk, jsonError } from '@/lib/api';
import { OPTION_COLORS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { updateMatchSchema } from '@/lib/validation';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const { id } = await params;
    const body = updateMatchSchema.parse(await request.json());
    const existing = await prisma.match.findUnique({ where: { id }, include: { predictions: { take: 1 } } });
    if (!existing) return jsonError('경기를 찾을 수 없습니다.', 404);
    if (existing.settledAt) return jsonError('정산 완료된 경기는 수정할 수 없습니다.', 409);

    const match = await prisma.$transaction(async (tx) => {
      if (body.options && existing.predictions.length === 0) {
        await tx.matchOption.deleteMany({ where: { matchId: id } });
      }
      const updated = await tx.match.update({
        where: { id },
        data: {
          title: body.title,
          sportType: body.sportType,
          description: body.description,
          startsAt: body.startsAt,
          locksAt: body.locksAt,
          status: body.status,
          resultOptionId: body.resultOptionId,
          ...(body.options && existing.predictions.length === 0
            ? {
                options: {
                  create: body.options.map((option, index) => ({
                    label: option.label,
                    className: option.className ?? null,
                    color: option.color ?? OPTION_COLORS[index % OPTION_COLORS.length],
                    sortOrder: index
                  }))
                }
              }
            : {})
        },
        include: { options: true }
      });
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: 'MATCH_UPDATED', matchId: id, metadata: body } });
      return updated;
    });
    return jsonOk(match);
  } catch (error) {
    return handleRouteError(error);
  }
}
