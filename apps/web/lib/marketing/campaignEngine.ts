import "server-only";

import { BrokerAdSimulationCampaignStatus, type BrokerAdSimulationCampaign, type BrokerAdSimulationPerformance } from "@prisma/client";

import { getLegacyDB } from "@/lib/db/legacy";
import {
  assertCampaignStatusTransition,
  computeBrokerSimulationSample,
  derivePerformanceMetrics,
  type CreateBrokerCampaignInput,
  type PerformanceWithDerived,
} from "./campaignEnginePure";

const prisma = getLegacyDB();

export type { AdPlatform, CampaignAudience, CreateBrokerCampaignInput, PerformanceWithDerived } from "./campaignEnginePure";
export { AUDIENCE_VALUES, assertCampaignStatusTransition, computeBrokerSimulationSample, derivePerformanceMetrics, parseAdPlatform } from "./campaignEnginePure";

/**
 * Create a **draft** simulated campaign (no ad platform calls).
 */
export async function createCampaign(input: CreateBrokerCampaignInput): Promise<BrokerAdSimulationCampaign> {
  return prisma.brokerAdSimulationCampaign.create({
    data: {
      userId: input.userId,
      audience: input.audience,
      city: input.city?.trim() || null,
      platform: input.platform,
      headline: input.headline,
      body: input.body,
      status: BrokerAdSimulationCampaignStatus.draft,
      createdBy: input.createdBy ?? "broker",
    },
  });
}

/**
 * Set schedule — moves campaign from `draft` to `scheduled` with `scheduledAt`.
 * @throws CAMPAIGN_NOT_FOUND | INVALID_CAMPAIGN_STATUS_TRANSITION
 */
export async function scheduleCampaign(
  campaignId: string,
  userId: string,
  at: Date
): Promise<BrokerAdSimulationCampaign> {
  const c = await prisma.brokerAdSimulationCampaign.findFirst({
    where: { id: campaignId, userId },
  });
  if (!c) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }
  assertCampaignStatusTransition(c.status, BrokerAdSimulationCampaignStatus.scheduled);
  return prisma.brokerAdSimulationCampaign.update({
    where: { id: campaignId },
    data: { status: BrokerAdSimulationCampaignStatus.scheduled, scheduledAt: at },
  });
}

export type RunCampaignResult =
  | {
      kind: "ran";
      campaign: BrokerAdSimulationCampaign;
      performance: BrokerAdSimulationPerformance;
    }
  | {
      kind: "noop";
      reason: "ALREADY_SIMULATED";
      campaign: BrokerAdSimulationCampaign;
      performance: BrokerAdSimulationPerformance;
    };

/**
 * **Simulation** run: one row per campaign; `scheduled` → `running` → `completed` in a single
 * `prisma.$transaction([...])`, or `running` with no performance (recovery) completes the run.
 * @throws CAMPAIGN_NOT_FOUND | SIMULATION_ALREADY_RAN | MUST_SCHEDULE_FIRST
 */
export async function runCampaignSimulation(campaignId: string, userId: string): Promise<RunCampaignResult> {
  const c = await prisma.brokerAdSimulationCampaign.findFirst({
    where: { id: campaignId, userId },
  });
  if (!c) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }

  const existingPerf = await prisma.brokerAdSimulationPerformance.findFirst({
    where: { campaignId },
  });
  if (existingPerf) {
    return { kind: "noop", reason: "ALREADY_SIMULATED", campaign: c, performance: existingPerf };
  }

  if (c.status === BrokerAdSimulationCampaignStatus.completed) {
    throw new Error("SIMULATION_ALREADY_RAN");
  }

  if (c.status === BrokerAdSimulationCampaignStatus.draft) {
    throw new Error("MUST_SCHEDULE_FIRST");
  }

  const isRecovery = c.status === BrokerAdSimulationCampaignStatus.running;
  if (!isRecovery && c.status !== BrokerAdSimulationCampaignStatus.scheduled) {
    throw new Error("INVALID_STATUS_FOR_RUN");
  }

  if (!isRecovery) {
    assertCampaignStatusTransition(
      BrokerAdSimulationCampaignStatus.scheduled,
      BrokerAdSimulationCampaignStatus.running
    );
  }

  const now = new Date();
  const { impressions, clicks, conversions, spend } = computeBrokerSimulationSample(c.platform, c.audience);

  const results = await prisma.$transaction([
    prisma.brokerAdSimulationCampaign.update({
      where: { id: campaignId },
      data: { status: BrokerAdSimulationCampaignStatus.running, startedAt: now, completedAt: null },
    }),
    prisma.brokerAdSimulationPerformance.create({
      data: { campaignId, impressions, clicks, conversions, spend },
    }),
    prisma.brokerAdSimulationCampaign.update({
      where: { id: campaignId },
      data: { status: BrokerAdSimulationCampaignStatus.completed, completedAt: new Date() },
    }),
  ]);
  const row = results[1] as BrokerAdSimulationPerformance;
  const done = results[2] as BrokerAdSimulationCampaign;
  return { kind: "ran", campaign: done, performance: row };
}

export type CampaignListRow = {
  campaign: BrokerAdSimulationCampaign;
  latestPerformance: BrokerAdSimulationPerformance | null;
  metrics: PerformanceWithDerived | null;
};

/**
 * For CRON: run simulation for `campaignId` (row must exist; secret auth at route).
 */
export async function runCampaignSimulationByCampaignId(campaignId: string): Promise<RunCampaignResult> {
  const c = await prisma.brokerAdSimulationCampaign.findFirst({
    where: { id: campaignId },
  });
  if (!c) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }
  return runCampaignSimulation(campaignId, c.userId);
}

export type GetCampaignPerformanceOptions = {
  campaignId?: string;
  limit?: number;
  offset?: number;
};

export type GetCampaignPerformanceResult =
  | {
      mode: "campaigns";
      items: CampaignListRow[];
      total: number;
      limit: number;
      offset: number;
    }
  | {
      mode: "performances";
      items: Array<{
        campaign: BrokerAdSimulationCampaign;
        performance: BrokerAdSimulationPerformance;
        metrics: PerformanceWithDerived;
      }>;
      total: number;
      limit: number;
      offset: number;
    };

/**
 * Without `campaignId`: paginated campaign list (latest first) with latest performance + derived metrics.
 * With `campaignId`: performance row(s) for that campaign, latest first, paginated.
 */
export async function getCampaignPerformance(
  userId: string,
  options?: GetCampaignPerformanceOptions
): Promise<GetCampaignPerformanceResult> {
  const limit = Math.min(Math.max(1, options?.limit ?? 20), 100);
  const offset = Math.max(0, options?.offset ?? 0);
  const campaignId = options?.campaignId;

  if (campaignId) {
    const own = await prisma.brokerAdSimulationCampaign.findFirst({
      where: { id: campaignId, userId },
    });
    if (!own) {
      return { mode: "performances", items: [], total: 0, limit, offset };
    }
    const [total, rows] = await Promise.all([
      prisma.brokerAdSimulationPerformance.count({ where: { campaignId } }),
      prisma.brokerAdSimulationPerformance.findMany({
        where: { campaignId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
    ]);
    const items = rows.map((performance) => ({
      campaign: own,
      performance,
      metrics: derivePerformanceMetrics(performance),
    }));
    return { mode: "performances", items, total, limit, offset };
  }

  const [total, rows] = await Promise.all([
    prisma.brokerAdSimulationCampaign.count({ where: { userId } }),
    prisma.brokerAdSimulationCampaign.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: { performanceRows: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);
  const items: CampaignListRow[] = rows.map((r) => {
    const { performanceRows, ...campaign } = r;
    const latest = performanceRows[0] ?? null;
    return {
      campaign,
      latestPerformance: latest,
      metrics: latest ? derivePerformanceMetrics(latest) : null,
    };
  });
  return { mode: "campaigns", items, total, limit, offset };
}
