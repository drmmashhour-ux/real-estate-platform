import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { canonicalStageFromLead, type LifecycleStage } from "@/modules/deal-lifecycle/lifecycle.stages";
import {
  aggregatePipelineMetrics,
  computeDealLifecycleSnapshot,
} from "@/modules/deal-lifecycle/lifecycle.engine";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const TAG = "[lifecycle]";

/** GET broker-scoped leads grouped for Kanban */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ error: "Brokers only" }, { status: 403 });
  }

  const leads = await prisma.lead.findMany({
    where: {
      introducedByBrokerId: userId,
    },
    orderBy: { updatedAt: "desc" },
    take: 250,
    select: {
      id: true,
      name: true,
      email: true,
      pipelineStage: true,
      pipelineStatus: true,
      lecipmCrmStage: true,
      updatedAt: true,
      nextFollowUpAt: true,
      lastContactAt: true,
      wonAt: true,
      lostAt: true,
      estimatedValue: true,
      dealValue: true,
      listingId: true,
      createdAt: true,
    },
  });

  type EnrichedLead = (typeof leads)[number] & {
    lifecycleStage: LifecycleStage;
    snapshot: ReturnType<typeof computeDealLifecycleSnapshot>;
  };

  const columns: Record<LifecycleStage, EnrichedLead[]> = {
    NEW_LEAD: [],
    CONTACTED: [],
    QUALIFIED: [],
    VISIT_SCHEDULED: [],
    OFFER_SENT: [],
    NEGOTIATION: [],
    CLOSED: [],
  };

  const enriched: EnrichedLead[] = [];

  for (const lead of leads) {
    const lifecycleStage = canonicalStageFromLead({
      lecipmCrmStage: lead.lecipmCrmStage,
      pipelineStage: lead.pipelineStage,
      pipelineStatus: lead.pipelineStatus,
      wonAt: lead.wonAt,
      lostAt: lead.lostAt,
    });
    const snapshot = computeDealLifecycleSnapshot({
      lecipmCrmStage: lead.lecipmCrmStage,
      pipelineStage: lead.pipelineStage,
      pipelineStatus: lead.pipelineStatus,
      wonAt: lead.wonAt,
      lostAt: lead.lostAt,
      nextFollowUpAt: lead.nextFollowUpAt,
      lastContactAt: lead.lastContactAt,
      updatedAt: lead.updatedAt,
    });
    const row: EnrichedLead = { ...lead, lifecycleStage, snapshot };
    enriched.push(row);
    columns[lifecycleStage].push(row);
  }

  const metrics = aggregatePipelineMetrics(
    enriched.map((e) => ({
      stage: e.lifecycleStage,
      pipelineStatus: e.pipelineStatus,
      createdAt: e.createdAt,
      wonAt: e.wonAt,
      lostAt: e.lostAt,
    }))
  );

  logInfo(`${TAG} pipeline.list`, { count: enriched.length });

  return NextResponse.json({
    columns,
    leads: enriched,
    metrics,
  });
}
