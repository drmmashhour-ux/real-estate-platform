import type { KpiWindow } from "../broker-kpis/broker-kpis.types";

export type CompanyMetricsWindow = KpiWindow;

export type CompanyMetricsRange = { startIso: string; endIso: string; label: CompanyMetricsWindow };

export type TopBrokerRow = {
  brokerId: string;
  brokerName: string | null;
  closedDeals: number;
  grossCommissionCents: number;
};

export type NeighborhoodRow = { city: string; inquiryCount: number; activeListings: number };

export type WorkflowBottleneckRow = {
  stage: string;
  dealCount: number;
};

export type CompanyMetricsSnapshot = {
  range: CompanyMetricsRange;
  generatedAt: string;
  scopeLabel: string;
  listings: {
    totalActiveResidential: number;
    newListingsInWindow: number;
    marketingEngagementAvg: number | null;
    engagementSampleSize: number;
  };
  leads: {
    totalLeads: number;
    qualifiedLeads: number;
  };
  deals: {
    active: number;
    acceptedOffers: number;
    inExecution: number;
    closed: number;
  };
  compliance: {
    casesOpened: number;
    openCases: number;
  };
  finance: {
    totalCommissionVolumeCents: number;
    brokerageRevenueOfficeShareCents: number;
    brokerPayoutTotalCents: number;
    invoiceTotalCents: number;
    overdueInvoices: number;
  };
  velocity: {
    avgResponseTimeHours: number | null;
    responseSampleSize: number;
    avgTimeToAcceptedOfferDays: number | null;
    acceptedOfferSampleSize: number;
    avgTimeToCloseDays: number | null;
    closeSampleSize: number;
  };
  blockers: {
    blockedDealRequests: number;
    overdueInvoices: number;
    dealsStuckFinancing: number;
  };
  rankings: {
    topBrokers: TopBrokerRow[];
    topNeighborhoods: NeighborhoodRow[];
    bottlenecksByStage: WorkflowBottleneckRow[];
  };
  disclaimer: string;
};

export type CompanyTimeseriesMetricId =
  | "closed_deals"
  | "new_leads"
  | "active_listings"
  | "commission_cents"
  | "compliance_cases";

export type CompanyTimeseriesPayload = {
  metric: CompanyTimeseriesMetricId;
  window: CompanyMetricsWindow;
  points: { date: string; value: number }[];
  disclaimer: string;
};
