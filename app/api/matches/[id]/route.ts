import { getMatchDetail } from '@/lib/matches';
import { getCurrentUser } from '@/lib/session';
import { handleRouteError, jsonOk, jsonError } from '@/lib/api';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const match = await getMatchDetail(id, user?.id);
    if (!match) return jsonError('경기를 찾을 수 없습니다.', 404);
    return jsonOk(match);
  } catch (error) {
    return handleRouteError(error);
  }
}
