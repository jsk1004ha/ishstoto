import { assertSameOrigin, handleRouteError, jsonOk } from '@/lib/api';
import { settleMatch } from '@/lib/betting';
import { requireAdmin } from '@/lib/session';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdmin();
    const { id } = await params;
    return jsonOk(await settleMatch(id, admin.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
