import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { clearAllSybn108TestData } from "@/lib/sybn/sybn108-clear-test-data";

export const dynamic = "force-dynamic";

/**
 * ORDER SYBNB-108 — DELETE rows with `isTest=true` (listings, bookings, synthetic users).
 * Requires admin session. POST only.
 */
export async function POST() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const result = await clearAllSybn108TestData();
  return NextResponse.json({
    ok: true,
    app: "syria" as const,
    ...result,
  });
}
