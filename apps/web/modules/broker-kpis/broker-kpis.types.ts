/**
 * Broker KPI board — types for aggregation and API responses.
 * Metrics are derived from platform data; disclaimers apply (see broker-kpi-explainer).
 */

export type KpiWindow = "today" | "7d" | "30d" | "quarter" | "year" | "custom";

export type KpiDateRange = { start: Date; end: Date; label: KpiWindow };

export type LeadKpiGroup = {
  newLeads: number;
  warmLeads: number;
  hotLeads: number;
  followUpOverdue: number;
  /** Estimated average hours from lead creation to first logged CRM interaction (sampled). */
  avgResponseTimeHours: number | null;
  responseSampleSize: number;
};

export type CommunicationKpiGroup = {
  outboundMessages: number;
  inboundMessages: number;
  draftsPendingApproval: number;
};

export type DealKpiGroup = {
  activeDeals: number;
  dealsInDrafting: number;
  dealsAwaitingSignature: number;
  dealsAwaitingConditions: number;
  dealsClosingReady: number;
  dealsClosedInWindow: number;
};

export type ExecutionKpiGroup = {
  documentsInDraft: number;
  documentsBrokerReview: number;
  executionPipelineBrokerReview: number;
  copilotSuggestionsPending: number;
};

export type NegotiationKpiGroup = {
  counterOffersInWindow: number;
  proposalsInWindow: number;
  counterOfferRate: number | null;
};

export type ClosingKpiGroup = {
  offerToCloseDaysAvg: number | null;
  offerToCloseSampleSize: number;
  closingConversionRate: number | null;
};

export type CoordinationKpiGroup = {
  documentRequestsOverdue: number;
  documentRequestsOpen: number;
  /** Median hours from signature session creation to last participant signed (completed sessions in window). */
  signatureCompletionHoursMedian: number | null;
  signatureSessionsCompleted: number;
  /** Average hours from payment requested → first confirmation (ledger), when available. */
  paymentConfirmationLagHoursAvg: number | null;
  paymentConfirmationSamples: number;
};

export type OverdueBlockersGroup = {
  openTasksPastDue: number;
  milestonesDueSoon: number;
  dealRequestsPastDue: number;
};

export type WorkloadSummaryGroup = {
  assignedDealsAsLead: number;
  pendingReviewItems: number;
  activeTeamAssignments: number;
};

export type BrokerKpiSnapshot = {
  window: KpiWindow;
  range: { startIso: string; endIso: string };
  generatedAt: string;
  lead: LeadKpiGroup;
  communication: CommunicationKpiGroup;
  deal: DealKpiGroup;
  execution: ExecutionKpiGroup;
  negotiation: NegotiationKpiGroup;
  closing: ClosingKpiGroup;
  coordination: CoordinationKpiGroup;
  overdue: OverdueBlockersGroup;
  workload: WorkloadSummaryGroup;
  disclaimer: string;
};

export type TimeseriesMetricId =
  | "active_deals"
  | "new_leads"
  | "closed_deals"
  | "counter_offers"
  | "open_requests";

export type TimeseriesPoint = { date: string; value: number };

export type BrokerKpiTimeseriesPayload = {
  metric: TimeseriesMetricId;
  window: KpiWindow;
  points: TimeseriesPoint[];
  disclaimer: string;
};
