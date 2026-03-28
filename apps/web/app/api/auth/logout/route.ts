import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_SESSION_COOKIE_NAME, HUB_USER_ROLE_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { revokeDbSessionByToken, resolveSessionTokenToUserId } from "@/lib/auth/db-session";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { DemoEvents } from "@/lib/demo-event-types";
import { DEMO_SESSION_STARTED_AT_COOKIE } from "@/lib/demo-session-cookie";

/** POST /api/auth/logout — Revoke server session, clear cookies. */
export async function POST() {
  const jar = await cookies();
  const sessionToken = jar.get(AUTH_SESSION_COOKIE_NAME)?.value?.trim() ?? "";
  const userId = sessionToken ? await resolveSessionTokenToUserId(sessionToken).catch(() => null) : null;
  await revokeDbSessionByToken(sessionToken);
  const startedRaw = jar.get(DEMO_SESSION_STARTED_AT_COOKIE)?.value;
  let durationSeconds: number | undefined;
  if (startedRaw) {
    const t = parseInt(startedRaw, 10);
    if (!Number.isNaN(t)) {
      durationSeconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
    }
  }
  if (process.env.NEXT_PUBLIC_ENV === "staging" && durationSeconds != null) {
    await trackDemoEvent(DemoEvents.SESSION_DURATION, { durationSeconds }, userId);
  }
  await trackDemoEvent(DemoEvents.SESSION_END, {}, userId);

  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(DEMO_SESSION_STARTED_AT_COOKIE, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure,
    sameSite: "lax",
  });
  res.cookies.set(AUTH_SESSION_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure,
    sameSite: "lax",
  });
  res.cookies.set(HUB_USER_ROLE_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    httpOnly: false,
    secure,
    sameSite: "lax",
  });
  return res;
}
