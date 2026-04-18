import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getGuestId } from "@/lib/auth/session";
import { evaluateLaunchFraudEngine, type LaunchFraudInput } from "@/modules/fraud/fraud-engine.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/fraud/check — explainable fraud evaluation (admin or self-scoped user).
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdminSession();
  const userId = await getGuestId().catch(() => null);
  if (!admin.ok && !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const input = body as LaunchFraudInput;

  if (!admin.ok && input.user?.id && input.user.id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!admin.ok && input.booking?.guestId && input.booking.guestId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await evaluateLaunchFraudEngine(input, {
      persist: admin.ok,
      actionType: typeof body.actionType === "string" ? body.actionType : "api_fraud_check",
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
