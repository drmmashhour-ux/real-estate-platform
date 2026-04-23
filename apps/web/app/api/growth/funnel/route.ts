import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { buildFullFunnelBundle } from "@/modules/growth-funnel/funnel.service";

export const dynamic = "force-dynamic";

/**
 * Platform funnel snapshots (event-backed) + optional CRM pipeline counts.
 * Session required — does not require FEATURE_GROWTH_MACHINE_V1 so existing admin Growth UI keeps working.
 */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const funnels = await buildFullFunnelBundle();

  let leadPipeline:
    | { scope: "broker"; byPipeline: Record<string, number> }
    | { scope: "admin"; byPipeline: Record<string, number> }
    | { scope: "limited"; byPipeline: Record<string, number>; note?: string }
    | undefined;

  if (user.role === PlatformRole.BROKER) {
    const rows = await prisma.lead.groupBy({
      by: ["pipelineStatus"],
      where: { introducedByBrokerId: userId },
      _count: { _all: true },
    });
    leadPipeline = {
      scope: "broker",
      byPipeline: Object.fromEntries(rows.map((r) => [r.pipelineStatus, r._count._all])),
    };
  } else if (user.role === PlatformRole.ADMIN || user.role === PlatformRole.ACCOUNTANT) {
    const rows = await prisma.lead.groupBy({
      by: ["pipelineStatus"],
      _count: { _all: true },
    });
    leadPipeline = {
      scope: "admin",
      byPipeline: Object.fromEntries(rows.map((r) => [r.pipelineStatus, r._count._all])),
    };
  } else {
    leadPipeline = {
      scope: "limited",
      byPipeline: {},
      note: "CRM pipeline breakdown is available for brokers and platform finance roles.",
    };
  }

  return NextResponse.json({ funnels, leadPipeline });
}
