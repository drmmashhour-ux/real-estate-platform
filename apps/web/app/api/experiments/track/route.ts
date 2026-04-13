import { NextRequest, NextResponse } from "next/server";
import { getCookieValueFromHeader } from "@/lib/auth/session-cookie";
import { EXPERIMENT_SESSION_COOKIE_NAME, EXPERIMENT_SESSION_HEADER } from "@/lib/experiments/constants";
import { trackBodySchema } from "@/lib/experiments/validators";
import { trackExperimentEvent } from "@/lib/experiments/track-event";
import { prisma } from "@/lib/db";
import { resolveSessionTokenToUserId } from "@/lib/auth/db-session";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { checkRateLimitDistributed, getRateLimitHeadersFromResult } from "@/lib/rate-limit-distributed";
import { RATE_PRESETS } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

function sessionIdFromRequest(request: NextRequest): string | null {
  const header = request.headers.get(EXPERIMENT_SESSION_HEADER)?.trim();
  if (header && header.length >= 8) return header;
  const cookie = request.cookies.get(EXPERIMENT_SESSION_COOKIE_NAME)?.value?.trim();
  if (cookie && cookie.length >= 8) return cookie;
  return null;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";
  const rl = await checkRateLimitDistributed(`experiments:track:${ip}`, RATE_PRESETS.searchHeavy);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: getRateLimitHeadersFromResult(rl) });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = trackBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 });
  }

  const { experimentId, variantId, eventName, metadata } = parsed.data;
  const sessionId = sessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "missing_experiment_session" }, { status: 400 });
  }

  const rawSession = getCookieValueFromHeader(request.headers.get("cookie"), AUTH_SESSION_COOKIE_NAME);
  const userId = await resolveSessionTokenToUserId(rawSession);

  const ok = await prisma.experimentAssignment.findFirst({
    where: {
      experimentId,
      variantId,
      OR: [{ sessionId }, ...(userId ? [{ userId }] : [])],
    },
    select: { id: true },
  });

  if (!ok) {
    return NextResponse.json({ error: "assignment_mismatch" }, { status: 403 });
  }

  await trackExperimentEvent(prisma, {
    experimentId,
    variantId,
    sessionId,
    userId,
    eventName: eventName as import("@/lib/experiments/constants").ExperimentEventName,
    metadata,
  });

  return NextResponse.json({ ok: true });
}
