import type { PlatformRole } from "@prisma/client";

import type {
  IntelligenceFeedItem,
  MarketplaceHealthPayload,
  Signal,
  SignalsByZone,
  StrategicRecommendation,
} from "./signal.types";

/** Visual/status lane for badges and KPI hints. */
export type CommandCenterStatusLane = "healthy" | "attention" | "urgent" | "inactive";

export type ExecutiveSummaryKpis = {
  revenueDisplay: string;
  revenueTrend: CommandCenterStatusLane;
  revenueHint: string;
  activeDeals: number;
  dealsTrend: CommandCenterStatusLane;
  bookedVisits: number;
  visitsTrend: CommandCenterStatusLane;
  conversionRateDisplay: string;
  conversionTrend: CommandCenterStatusLane;
  trustScore: number | null;
  trustBand: string | null;
  trustTrend: CommandCenterStatusLane;
  automationDisplay: string;
  automationTrend: CommandCenterStatusLane;
};

export type TrendMini = {
  lane: CommandCenterStatusLane;
  label: string;
};

export type CommandCenterDealRow = {
  id: string;
  label: string;
  stage: string;
  priceCents: number;
  score: number | null;
  riskHint: string | null;
  updatedAt: string;
};

export type CommandCenterLeadRow = {
  id: string;
  contactLabel: string;
  intentLevel: string | null;
  status: string;
  createdAt: string;
  source: string | null;
};

export type FeedItemDomain =
  | "booking"
  | "lead"
  | "deal"
  | "trust"
  | "dispute"
  | "approval"
  | "autopilot"
  | "marketing";

export type CommandCenterFeedItem = {
  id: string;
  domain: FeedItemDomain;
  title: string;
  detail?: string;
  href: string;
  createdAt: string;
  statusLane: CommandCenterStatusLane;
  icon: "calendar" | "user" | "briefcase" | "shield" | "alert" | "spark" | "chart";
};

export type AlertApprovalRow = {
  id: string;
  kind: string;
  title: string;
  severity: CommandCenterStatusLane;
  href: string;
  createdAt: string;
  actions?: { approveApi?: string; rejectApi?: string };
};

export type TrustRiskPanelData = {
  trustScore: number | null;
  trustBand: string | null;
  disputeRiskScore: number | null;
  openDisputes: number;
  complianceNotes: string[];
  topIssues: string[];
  sharpestDrops: Array<{ targetType: string; targetId: string; delta: number | null }>;
  remediationLinks: Array<{ label: string; href: string }>;
};

export type MarketingExpansionData = {
  scheduledHint: string;
  campaignHint: string;
  expansionHint: string;
  territoryOpportunity: string;
  nextMove: string;
  links: Array<{ label: string; href: string }>;
};

export type CommandCenterSummaryPayload = {
  executive: ExecutiveSummaryKpis;
  revenueGrowthHint: string;
  priorityDeals: CommandCenterDealRow[];
  stalledDeals: CommandCenterDealRow[];
  hotLeads: CommandCenterLeadRow[];
  followUpLeads: CommandCenterLeadRow[];
  trustRisk: TrustRiskPanelData;
  marketing: MarketingExpansionData;
  generatedAt: string;
};

export type SystemPerformanceRow = {
  label: string;
  value: string;
  hint?: string;
  lane: CommandCenterStatusLane;
};

export type SystemPerformancePanelView = {
  title: string;
  headline: string;
  rows: SystemPerformanceRow[];
  wins: Array<{ id: string; title: string; detail: string; at: string }>;
  misses: Array<{ id: string; title: string; detail: string; at: string }>;
  seriesHint: string;
  /** Last 7 points of daily accuracy in-window (oldest first). */
  series: Array<{ day: string; accuracy: number | null; count: number }>;
  learningQueue: number;
  generatedAt: string;
} | null;

export type CommandCenterPagePayload = {
  summary: CommandCenterSummaryPayload;
  /** Raw chronological feed (auditable); prefer `intelligenceFeed` in UI. */
  feed: CommandCenterFeedItem[];
  intelligenceFeed: IntelligenceFeedItem[];
  alerts: AlertApprovalRow[];
  signals: Signal[];
  signalsPrimary: Signal[];
  signalsByZone: SignalsByZone;
  marketplaceHealth: MarketplaceHealthPayload;
  strategicRecommendations: StrategicRecommendation[];
  systemPerformance: SystemPerformancePanelView;
  role: PlatformRole;
  viewMode: "executive" | "broker";
  generatedAt: string;
};

export function isExecutiveCommandCenter(role: PlatformRole): boolean {
  return role === "ADMIN";
}
