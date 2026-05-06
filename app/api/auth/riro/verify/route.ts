import { NextResponse } from 'next/server';
import { riroVerifySchema } from '@/lib/validation';
import { riroAuthAdapter } from '@/lib/riro/auth-adapter';
import { assertSameOrigin, handleRouteError, jsonOk } from '@/lib/api';
import { setSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = riroVerifySchema.parse(await request.json());
    const result = await riroAuthAdapter(body);
    if (!result.ok) return NextResponse.json({ ok: false, message: result.message }, { status: 401 });

    await setSession({
      riroVerified: true,
      realName: result.realName,
      studentNumber: result.studentNumber,
      generation: result.generation,
      role: result.role
    }, 60 * 30);

    return jsonOk({
      realName: result.realName,
      studentNumber: result.studentNumber,
      generation: result.generation,
      role: result.role
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
