import type { NextResponse } from "next/server";
import { createDbSession } from "@/lib/auth/db-session";
import { setGuestIdCookie, setUserRoleCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { LOCALE_COOKIE, UI_LOCALE_ENTRIES, type LocaleCode } from "@/lib/i18n/locales";
import { AnalyticsEvents } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { trackDemoEvent, trackDemoUserTypeFromRole } from "@/lib/demo-analytics";
import { DemoEvents } from "@/lib/demo-event-types";
import { DEMO_SESSION_COOKIE_MAX_AGE_SEC, DEMO_SESSION_STARTED_AT_COOKIE } from "@/lib/demo-session-cookie";
import { ensureReferralCode } from "@/lib/referrals";

/** Sets session + role cookies and demo analytics after successful password or 2FA login. */
export async function applyLoginSessionCookies(
  res: NextResponse,
  user: { id: string; role: string }
): Promise<void> {
  await ensureReferralCode(user.id).catch(() => {});
  const token = await createDbSession(user.id);
  const cookie = setGuestIdCookie(token);
  res.cookies.set(cookie.name, cookie.value, {
    path: cookie.path,
    domain: cookie.domain,
    maxAge: cookie.maxAge,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
  });
  void trackDemoEvent(DemoEvents.LOGIN, { source: "password" }, user.id);
  void trackDemoEvent(DemoEvents.SESSION_START, { source: "password" }, user.id);
  trackDemoUserTypeFromRole(user.id, user.role);

  const roleCk = setUserRoleCookie(user.role);
  res.cookies.set(roleCk.name, roleCk.value, {
    path: roleCk.path,
    domain: roleCk.domain,
    maxAge: roleCk.maxAge,
    httpOnly: roleCk.httpOnly,
    secure: roleCk.secure,
    sameSite: roleCk.sameSite,
  });
  captureServerEvent(user.id, AnalyticsEvents.LOGIN_COMPLETED, { source: "session" });

  const prefRow = await prisma.user.findUnique({
    where: { id: user.id },
    select: { preferredUiLocale: true },
  });
  const pref = prefRow?.preferredUiLocale?.trim();
  const uiLocale = UI_LOCALE_ENTRIES.find((l) => l.code === (pref as LocaleCode))?.code;
  if (uiLocale) {
    res.cookies.set(LOCALE_COOKIE, uiLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: false,
    });
  }

  if (process.env.NEXT_PUBLIC_ENV === "staging") {
    const secure = process.env.NODE_ENV === "production";
    res.cookies.set(DEMO_SESSION_STARTED_AT_COOKIE, String(Date.now()), {
      path: "/",
      maxAge: DEMO_SESSION_COOKIE_MAX_AGE_SEC,
      httpOnly: true,
      secure,
      sameSite: "lax",
    });
  }
}
