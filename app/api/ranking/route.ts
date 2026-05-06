import { handleRouteError, jsonOk } from '@/lib/api';
import { getRanking } from '@/lib/matches';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return jsonOk(await getRanking(user?.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
