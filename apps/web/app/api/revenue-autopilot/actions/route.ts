import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { REVENUE_PLATFORM_SCOPE_ID } from "@/lib/revenue-autopilot/constants";
import { requireRevenueScope } from "@/lib/revenue-autopilot/revenue-guard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const st = url.searchParams.get("scopeType") as "owner" | "platform" | null;
  const sid = url.searchParams.get("scopeId");
  const status = url.searchParams.get("status");

  const scopeType = st === "platform" ? "platform" : "owner";
  const gate = await requireRevenueScope({
    scopeType,
    scopeId: scopeType === "platform" ? REVENUE_PLATFORM_SCOPE_ID : sid,
  });
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const actions = await prisma.revenueAutopilotAction.findMany({
    where: {
      scopeType: gate.scopeType,
      scopeId: gate.scopeId,
      ...(status && ["suggested", "approved", "rejected", "applied"].includes(status)
        ? { status: status as "suggested" | "approved" | "rejected" | "applied" }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return NextResponse.json({ actions });
}
