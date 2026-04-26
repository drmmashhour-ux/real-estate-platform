import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { buildGrowthDashboardPayload } from "@/modules/growth-reporting";
import { summarizeGrowthBlockers } from "@/modules/growth-reporting/growth-summary.service";
import { findStaleLeadsForBroker } from "@/modules/lead-nurture/reengagement.service";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const dash = await buildGrowthDashboardPayload({ userId: auth.userId, role: auth.role });

  let stale = 0;
  if (auth.role === PlatformRole.BROKER) {
    stale = (await findStaleLeadsForBroker(auth.userId, 14).catch(() => [])).length;
  }

  const openLeads =
    auth.role === PlatformRole.BROKER
      ? await prisma.lead.count({
          where: { introducedByBrokerId: auth.userId, pipelineStatus: { notIn: ["won", "lost"] } },
        })
      : 0;

  const blockers = summarizeGrowthBlockers({
    openLeads,
    staleLeads: stale,
    campaignsActive: dash.campaignsCount,
  });

  return NextResponse.json({
    dashboard: dash,
    blockers,
  });
}
