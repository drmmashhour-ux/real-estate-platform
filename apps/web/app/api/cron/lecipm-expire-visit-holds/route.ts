import { NextRequest, NextResponse } from "next/server";
import { expireStaleHolds } from "@/modules/booking-system/booking-conflict.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/lecipm-expire-visit-holds — cancels soft holds that passed `hold_expires_at`.
 * Authorization: Bearer `CRON_SECRET`
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const count = await expireStaleHolds();
  return NextResponse.json({ kind: "lecipm_visit_hold_expiry_v1", cancelled: count });
}
