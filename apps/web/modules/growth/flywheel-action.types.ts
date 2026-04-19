/**
 * Flywheel action tracking — operator-initiated, auditable; no automation.
 */

import type { MarketplaceFlywheelInsightType } from "@/modules/marketplace/flywheel.types";

/** Same taxonomy as marketplace flywheel insights (`flywheel.types`). */
export type FlywheelInsightBindType = MarketplaceFlywheelInsightType;

export type FlywheelActionType =
  | "broker_acquisition"
  | "demand_generation"
  | "supply_growth"
  | "conversion_fix"
  | "pricing_adjustment";

export type FlywheelActionStatus =
  | "proposed"
  | "acknowledged"
  | "in_progress"
  | "completed"
  | "abandoned";

export type FlywheelOutcomeScore =
  | "positive"
  | "neutral"
  | "negative"
  | "insufficient_data";

export type FlywheelActionOutcome = {
  actionId: string;
  measuredAt: string;
  brokerCountDelta: number;
  leadCountDelta: number;
  listingCountDelta: number;
  conversionRateDelta: number;
  unlockRateDelta: number;
  revenueDelta?: number | null;
  outcomeScore: FlywheelOutcomeScore;
  explanation: string;
};

export type FlywheelAction = {
  id: string;
  type: FlywheelActionType;
  insightType: FlywheelInsightBindType;
  insightId: string;
  createdAt: string;
  createdBy: string;
  status: FlywheelActionStatus;
  note?: string | null;
  baselineBrokers: number;
  baselineLeads30: number;
  baselineListings: number;
  baselineConversionRate: number;
  baselineUnlockRate: number;
  evaluationWindowDays: number;
};

export type FlywheelActionWithLatestOutcome = FlywheelAction & {
  latestOutcome: FlywheelActionOutcome | null;
};
