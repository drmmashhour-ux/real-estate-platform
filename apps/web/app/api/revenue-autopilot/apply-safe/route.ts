import { NextResponse } from "next/server";
import { REVENUE_PLATFORM_SCOPE_ID } from "@/lib/revenue-autopilot/constants";
import { applySafeRevenueActions } from "@/lib/revenue-autopilot/apply-safe-revenue-actions";
import { requireRevenueScope } from "@/lib/revenue-autopilot/revenue-guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    scopeType?: "owner" | "platform";
    scopeId?: string;
  };
  const scopeType = body.scopeType === "platform" ? "platform" : "owner";
  const gate = await requireRevenueScope({
    scopeType,
    scopeId: scopeType === "platform" ? REVENUE_PLATFORM_SCOPE_ID : body.scopeId,
  });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const result = await applySafeRevenueActions({
      scopeType: gate.scopeType,
      scopeId: gate.scopeId,
      performedByUserId: gate.userId,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Apply failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
