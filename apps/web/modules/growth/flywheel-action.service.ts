/**
 * Explicit operator-created flywheel actions — no automation, no side effects beyond DB rows.
 */

import { prisma } from "@/lib/db";
import type { MarketplaceFlywheelInsightType } from "@/modules/marketplace/flywheel.types";
import {
  collectFlywheelMarketplaceMetrics,
  type FlywheelMarketplaceMetrics,
} from "@/modules/marketplace/flywheel.service";
import type {
  FlywheelAction,
  FlywheelActionOutcome,
  FlywheelActionStatus,
  FlywheelActionType,
  FlywheelActionWithLatestOutcome,
} from "@/modules/growth/flywheel-action.types";
import { monitorFlywheelActionCreated, monitorFlywheelActionStatusUpdated } from "@/modules/growth/flywheel-monitoring.service";

export function defaultActionTypeForInsight(insightType: MarketplaceFlywheelInsightType): FlywheelActionType {
  switch (insightType) {
    case "broker_gap":
      return "broker_acquisition";
    case "demand_gap":
      return "demand_generation";
    case "supply_gap":
      return "supply_growth";
    case "conversion_opportunity":
      return "conversion_fix";
    case "pricing_opportunity":
      return "pricing_adjustment";
    default: {
      const _: never = insightType;
      return _;
    }
  }
}

function mapRow(row: {
  id: string;
  type: string;
  insightId: string;
  insightType: string;
  status: string;
  note: string | null;
  createdByUserId: string;
  createdAt: Date;
  baselineBrokers: number;
  baselineLeads30: number;
  baselineListings: number;
  baselineConversionRate: number;
  baselineUnlockRate: number;
  evaluationWindowDays: number;
}): FlywheelAction {
  return {
    id: row.id,
    type: row.type as FlywheelActionType,
    insightId: row.insightId,
    insightType: row.insightType as FlywheelAction["insightType"],
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdByUserId,
    status: row.status as FlywheelActionStatus,
    note: row.note,
    baselineBrokers: row.baselineBrokers,
    baselineLeads30: row.baselineLeads30,
    baselineListings: row.baselineListings,
    baselineConversionRate: row.baselineConversionRate,
    baselineUnlockRate: row.baselineUnlockRate,
    evaluationWindowDays: row.evaluationWindowDays,
  };
}

export type CreateFlywheelActionInput = {
  insightId: string;
  insightType: MarketplaceFlywheelInsightType;
  /** Defaults from insight taxonomy */
  actionType?: FlywheelActionType;
  createdByUserId: string;
  status?: FlywheelActionStatus;
  note?: string | null;
  evaluationWindowDays?: number;
};

const VALID_ACTION_TYPES: FlywheelActionType[] = [
  "broker_acquisition",
  "demand_generation",
  "supply_growth",
  "conversion_fix",
  "pricing_adjustment",
];

export async function createFlywheelAction(input: CreateFlywheelActionInput): Promise<FlywheelAction> {
  if (input.actionType && !VALID_ACTION_TYPES.includes(input.actionType)) {
    throw new Error("Invalid actionType");
  }
  const metrics = await collectFlywheelMarketplaceMetrics();
  const type = input.actionType ?? defaultActionTypeForInsight(input.insightType);
  const status = input.status ?? "proposed";

  const row = await prisma.marketplaceFlywheelAction.create({
    data: {
      type,
      insightId: input.insightId.slice(0, 140),
      insightType: input.insightType,
      status,
      note: input.note?.trim() || null,
      createdByUserId: input.createdByUserId,
      baselineBrokers: metrics.brokerCount,
      baselineLeads30: metrics.leadCount30,
      baselineListings: metrics.activeListings,
      baselineConversionRate: metrics.winRate,
      baselineUnlockRate: metrics.unlockRate,
      evaluationWindowDays: input.evaluationWindowDays ?? 14,
    },
  });

  monitorFlywheelActionCreated({
    actionId: row.id,
    type: row.type,
    insightId: row.insightId,
    actorUserId: input.createdByUserId,
  });

  return mapRow(row);
}

export async function updateFlywheelActionStatus(
  id: string,
  status: FlywheelActionStatus,
  actorUserId?: string,
): Promise<FlywheelAction | null> {
  try {
    const row = await prisma.marketplaceFlywheelAction.update({
      where: { id },
      data: { status },
    });
    monitorFlywheelActionStatusUpdated({ actionId: id, status, actorUserId });
    return mapRow(row);
  } catch {
    return null;
  }
}

export type ListFlywheelActionsParams = {
  take?: number;
  status?: FlywheelActionStatus;
};

export async function listFlywheelActions(params?: ListFlywheelActionsParams): Promise<FlywheelAction[]> {
  const take = Math.min(Math.max(params?.take ?? 80, 1), 200);
  const rows = await prisma.marketplaceFlywheelAction.findMany({
    where: params?.status ? { status: params.status } : undefined,
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(mapRow);
}

function mapOutcomeRowLite(row: {
  actionId: string;
  measuredAt: Date;
  brokerCountDelta: number;
  leadCountDelta: number;
  listingCountDelta: number;
  conversionRateDelta: number;
  unlockRateDelta: number;
  revenueDelta: number | null;
  outcomeScore: string;
  explanation: string;
}): FlywheelActionOutcome {
  return {
    actionId: row.actionId,
    measuredAt: row.measuredAt.toISOString(),
    brokerCountDelta: row.brokerCountDelta,
    leadCountDelta: row.leadCountDelta,
    listingCountDelta: row.listingCountDelta,
    conversionRateDelta: row.conversionRateDelta,
    unlockRateDelta: row.unlockRateDelta,
    revenueDelta: row.revenueDelta,
    outcomeScore: row.outcomeScore as FlywheelActionOutcome["outcomeScore"],
    explanation: row.explanation,
  };
}

export async function listFlywheelActionsWithLatestOutcome(
  params?: ListFlywheelActionsParams,
): Promise<FlywheelActionWithLatestOutcome[]> {
  const take = Math.min(Math.max(params?.take ?? 80, 1), 200);
  const rows = await prisma.marketplaceFlywheelAction.findMany({
    where: params?.status ? { status: params.status } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      outcomes: { orderBy: { measuredAt: "desc" }, take: 1 },
    },
  });

  return rows.map((r) => ({
    ...mapRow(r),
    latestOutcome: r.outcomes[0] ? mapOutcomeRowLite(r.outcomes[0]) : null,
  }));
}

export async function getFlywheelActionById(id: string): Promise<FlywheelAction | null> {
  const row = await prisma.marketplaceFlywheelAction.findUnique({ where: { id } });
  return row ? mapRow(row) : null;
}

export function metricsBaselineSubset(m: FlywheelMarketplaceMetrics) {
  return {
    brokerCount: m.brokerCount,
    leadCount30: m.leadCount30,
    activeListings: m.activeListings,
    unlockRate: m.unlockRate,
    winRate: m.winRate,
  };
}
