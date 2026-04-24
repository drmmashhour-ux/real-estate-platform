import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getGuestId } from "@/lib/auth/session";
import {
  LECIPM_DASHBOARD_CONSOLE_COOKIE,
  cookieOpts,
  type LecipmDashboardConsolePreference,
} from "@/lib/dashboard/lecipm-console-preference";
import { trackEvent } from "@/src/modules/analytics/eventTracker";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { preference?: string };
  try {
    body = (await request.json()) as { preference?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const pref = body.preference;
  if (pref !== "classic" && pref !== "lecipm") {
    return NextResponse.json({ error: "invalid_preference" }, { status: 400 });
  }

  const jar = await cookies();
  jar.set(LECIPM_DASHBOARD_CONSOLE_COOKIE, pref, cookieOpts());

  await trackEvent(
    "dashboard_console_preference_set",
    { preference: pref, source: "api" },
    { userId },
  );

  return NextResponse.json({ ok: true, preference: pref as LecipmDashboardConsolePreference });
}

export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jar = await cookies();
  const v = jar.get(LECIPM_DASHBOARD_CONSOLE_COOKIE)?.value;
  const preference =
    v === "classic" || v === "lecipm" ? v : ("unset" as const);
  return NextResponse.json({ preference });
}
