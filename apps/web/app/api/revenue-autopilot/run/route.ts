import { NextResponse } from "next/server";
import { REVENUE_PLATFORM_SCOPE_ID } from "@/lib/revenue-autopilot/constants";
import { requireRevenueScope } from "@/lib/revenue-autopilot/revenue-guard";
import { runRevenueAutopilot } from "@/lib/revenue-autopilot/run-revenue-autopilot";

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
    const result = await runRevenueAutopilot({
      scopeType: gate.scopeType,
      scopeId: gate.scopeId,
      performedByUserId: gate.userId,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Run failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
