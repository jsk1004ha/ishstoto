import { getMatchSummaries } from '@/lib/matches';
import { getCurrentUser } from '@/lib/session';
import { handleRouteError, jsonOk } from '@/lib/api';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const matches = await getMatchSummaries(user?.id);
    return jsonOk(matches);
  } catch (error) {
    return handleRouteError(error);
  }
}
