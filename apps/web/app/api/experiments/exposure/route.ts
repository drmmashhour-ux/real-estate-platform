import { NextRequest, NextResponse } from "next/server";
import { EXPERIMENT_SESSION_COOKIE_NAME, EXPERIMENT_SESSION_HEADER } from "@/lib/experiments/constants";
import { recordExperimentExposure } from "@/src/modules/experiments/exposure.service";
import { resolveSessionTokenToUserId } from "@/lib/auth/db-session";
import { getCookieValueFromHeader } from "@/lib/auth/session-cookie";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

export const dynamic = "force-dynamic";

function sessionIdFromRequest(request: NextRequest): string | null {
  const header = request.headers.get(EXPERIMENT_SESSION_HEADER)?.trim();
  if (header && header.length >= 8) return header;
  const cookie = request.cookies.get(EXPERIMENT_SESSION_COOKIE_NAME)?.value?.trim();
  if (cookie && cookie.length >= 8) return cookie;
  return null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    slug?: string;
    surface?: string;
  };
  const slug = body.slug?.trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });
  }
  const sessionId = sessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "missing_experiment_session" }, { status: 400 });
  }
  const rawSession = getCookieValueFromHeader(request.headers.get("cookie"), AUTH_SESSION_COOKIE_NAME);
  const userId = await resolveSessionTokenToUserId(rawSession);

  const out = await recordExperimentExposure({ experimentSlug: slug, sessionId, userId, surface: body.surface });
  return NextResponse.json({ ok: true, ...out });
}
