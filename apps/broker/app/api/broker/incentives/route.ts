import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { brokerIncentivesFlags, brokerIncentivesPanelFlags } from "@/config/feature-flags";
import { buildBrokerIncentiveSummary } from "@/modules/broker/incentives/broker-incentives-summary.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!brokerIncentivesFlags.brokerIncentivesV1 || !brokerIncentivesPanelFlags.brokerIncentivesPanelV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "BROKER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const summary = await buildBrokerIncentiveSummary(userId);
  if (!summary) return NextResponse.json({ error: "Unable to build incentives" }, { status: 500 });

  return NextResponse.json({
    summary,
    disclaimer:
      "Recognition only — no payments, commissions, or guaranteed outcomes. Based on measurable CRM signals.",
  });
}
