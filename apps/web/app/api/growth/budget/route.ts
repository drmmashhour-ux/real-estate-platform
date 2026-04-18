import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { allocateLaunchBudget } from "@/modules/growth-strategy/budget-engine.service";
import { simulateFromAllocatedBudget } from "@/modules/growth-strategy/performance-simulator";

export const dynamic = "force-dynamic";

/** POST /api/growth/budget — allocate + simulate (admin). Body: { totalBudget, city?, avgBookingValueCad?, bnhubTakeRate? } */
export async function POST(req: NextRequest) {
  const s = await requireAdminSession();
  if (!s.ok) return NextResponse.json({ error: s.error }, { status: s.status });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const totalBudget = typeof body.totalBudget === "number" ? body.totalBudget : Number(body.totalBudget);
  const city = typeof body.city === "string" && body.city.trim() ? body.city.trim() : "Montreal";
  const avgBookingValueCad =
    body.avgBookingValueCad != null && body.avgBookingValueCad !== ""
      ? Number(body.avgBookingValueCad)
      : undefined;
  const bnhubTakeRate =
    body.bnhubTakeRate != null && body.bnhubTakeRate !== "" ? Number(body.bnhubTakeRate) : undefined;

  if (!Number.isFinite(totalBudget)) {
    return NextResponse.json({ error: "totalBudget required (500–1000 CAD)" }, { status: 400 });
  }

  const allocation = allocateLaunchBudget({ totalBudget, city });
  const simulation = simulateFromAllocatedBudget(allocation, {
    avgBookingValueCad: Number.isFinite(avgBookingValueCad) ? avgBookingValueCad : undefined,
    bnhubTakeRate: Number.isFinite(bnhubTakeRate) ? bnhubTakeRate : undefined,
  });

  return NextResponse.json({ allocation, simulation });
}
