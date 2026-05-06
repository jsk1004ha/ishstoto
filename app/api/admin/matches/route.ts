import { OPTION_COLORS } from '@/lib/constants';
import { assertSameOrigin, handleRouteError, jsonOk } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { createMatchSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const body = createMatchSchema.parse(await request.json());
    const match = await prisma.$transaction(async (tx) => {
      const created = await tx.match.create({
        data: {
          title: body.title,
          sportType: body.sportType,
          description: body.description,
          startsAt: body.startsAt,
          locksAt: body.locksAt,
          status: body.status,
          createdBy: admin.id,
          options: {
            create: body.options.map((option, index) => ({
              label: option.label,
              className: option.className ?? null,
              color: option.color ?? OPTION_COLORS[index % OPTION_COLORS.length],
              sortOrder: index
            }))
          }
        },
        include: { options: true }
      });
      await tx.adminAuditLog.create({ data: { actorId: admin.id, action: 'MATCH_CREATED', matchId: created.id, metadata: body } });
      return created;
    });
    return jsonOk(match, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
