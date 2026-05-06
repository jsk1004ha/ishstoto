import { handleRouteError, jsonOk } from '@/lib/api';
import { getUserProfile } from '@/lib/matches';
import { requireUser } from '@/lib/session';

export async function GET() {
  try {
    const user = await requireUser();
    return jsonOk(await getUserProfile(user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
