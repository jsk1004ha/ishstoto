import { assertSameOrigin, handleRouteError, jsonOk, jsonError } from '@/lib/api';
import { placePrediction } from '@/lib/betting';
import { checkRateLimit } from '@/lib/rate-limit';
import { requireUser } from '@/lib/session';
import { predictSchema } from '@/lib/validation';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const key = `${user.id}:${request.headers.get('x-forwarded-for') ?? 'local'}`;
    const limited = checkRateLimit(key, 8, 60_000);
    if (!limited.ok) return jsonError(`요청이 너무 많습니다. ${limited.retryAfter}초 뒤 다시 시도해 주세요.`, 429);

    const { id } = await params;
    const body = predictSchema.parse(await request.json());
    const result = await placePrediction(user.id, id, body.optionId, body.points);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
