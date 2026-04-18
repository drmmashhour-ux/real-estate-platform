import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { engineFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { buildScalePlan } from "@/modules/growth/scale-system.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.scaleSystemV1) {
    return NextResponse.json({ error: "Scale system disabled" }, { status: 403 });
  }
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const { plan, metrics } = buildScalePlan();
    const leadCount30d = await prisma.lead.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });
    const brokerUsers = await prisma.user.count({ where: { role: PlatformRole.BROKER } });

    const filled = metrics.map((m) => {
      if (m.name.startsWith("Leads / month")) return { ...m, value: leadCount30d };
      if (m.name.startsWith("Active brokers")) return { ...m, value: brokerUsers };
      return { ...m };
    });

    return NextResponse.json({
      plan,
      metrics: filled,
      gaps: {
        leadsVsTarget: Math.max(0, plan.requiredLeads - leadCount30d),
        brokersVsTarget: Math.max(0, 30 - brokerUsers),
      },
    });
  } catch (e) {
    console.error("[growth/scale-system]", e);
    return NextResponse.json({ error: "Failed to load scale system" }, { status: 500 });
  }
}
