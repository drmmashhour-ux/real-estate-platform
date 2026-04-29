import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { runInvestorDemoResetThrottled, SYRIA_DEMO_RESET_COOLDOWN_MS } from "@/lib/demo/demo-session";

export const dynamic = "force-dynamic";

/**
 * Admin-only JSON API — uses {@link getAdminUser} (403 when not admin); admin pages use {@link requireAdmin}.
 */
export async function POST() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const result = await runInvestorDemoResetThrottled(`manual:${admin.id}`);
  if (result.skipped) {
    const mins = SYRIA_DEMO_RESET_COOLDOWN_MS / 60_000;
    return NextResponse.json(
      { ok: false, message: `Reset cooldown active (${mins} min)`, skipped: true },
      { status: 429 },
    );
  }
  if (result.error) {
    return NextResponse.json({ ok: false, message: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
