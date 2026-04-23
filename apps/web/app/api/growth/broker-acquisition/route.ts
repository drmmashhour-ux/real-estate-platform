import { NextResponse } from "next/server";
import { BROKER_PROSPECT_STATUSES } from "@/modules/growth/broker-prospect.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const total = await prisma.brokerProspect.count();
    const byStatus: Record<string, number> = {};
    await Promise.all(
      BROKER_PROSPECT_STATUSES.map(async (status) => {
        const n = await prisma.brokerProspect.count({ where: { status } });
        byStatus[status] = n;
      }),
    );
    return NextResponse.json({ total, byStatus });
  } catch (e) {
    console.error("[growth/broker-acquisition]", e);
    return NextResponse.json({ error: "Failed to load broker acquisition summary" }, { status: 500 });
  }
}
