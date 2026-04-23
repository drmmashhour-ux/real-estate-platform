import type { LecipmDisputeCaseEntityType, LecipmDisputeCaseStatus } from "@prisma/client";

import type { TimelineRow } from "@/modules/dispute-room/dispute-case-timeline";

export type { TimelineRow };

/** Unified timeline row with LECIPM channel attribution (booking / deal / AI / autopilot / dispute). */
export type UnifiedTimelineRow = TimelineRow & {
  channel: string;
};

export type DisputeObservabilityMetrics = {
  totalOpen: number;
  total: number;
  byStatus: Array<{ status: LecipmDisputeCaseStatus; _count: { _all: number } }>;
  byCategory: Array<{ category: string; _count: { _all: number } }>;
  avgResolutionDays: number | null;
  sampleSize: number;
  disputesLast30dBooking: number;
  bookingsLast30d: number;
  disputeRatePerBooking30d: number | null;
  topCauses: Array<{ category: string; count: number }>;
  conversionImpactNote: string;
};

export type RelatedEntityLabel = {
  type: LecipmDisputeCaseEntityType;
  id: string;
  label: string;
};
