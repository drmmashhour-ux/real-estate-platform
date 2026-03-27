/**
 * TrustGraph feature flags — `TRUSTGRAPH_ENABLED` is the master switch.
 * When master is on, sub-feature env vars default to **enabled** unless explicitly set to false.
 */
function parseTruthy(raw: string | undefined): boolean {
  if (raw == null || raw === "") return false;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

/** Sub-features: unset → on (when master is on); explicit `false` / `0` / `off` turns off. */
function subFeatureTruthy(envKey: string): boolean {
  const raw = process.env[envKey];
  if (raw == null || raw === "") return true;
  return parseTruthy(raw);
}

/** Phase 5 growth surfaces default OFF until explicitly enabled. */
function phase5Truthy(envKey: string): boolean {
  return parseTruthy(process.env[envKey]);
}

/** Phase 6 intelligence layer default OFF until explicitly enabled. */
function phase6Truthy(envKey: string): boolean {
  return parseTruthy(process.env[envKey]);
}

/** Phase 7 enterprise / compliance default OFF until explicitly enabled. */
function phase7Truthy(envKey: string): boolean {
  return parseTruthy(process.env[envKey]);
}

/** Phase 8 billing / audit / partner API default OFF until explicitly enabled. */
function phase8Truthy(envKey: string): boolean {
  return parseTruthy(process.env[envKey]);
}

export type TrustGraphFeatureFlags = {
  /** Master switch — engine, schema, APIs (except admin queue can be gated separately). */
  enabled: boolean;
  /** Admin queue UI + GET /api/trustgraph/queue */
  adminQueue: boolean;
  /** Listing trust badge in seller/dashboard surfaces */
  listingBadge: boolean;
  /** Broker verification chip in broker surfaces */
  brokerBadge: boolean;
  /** Seller declaration readiness widget */
  declarationWidget: boolean;
  /** Phase 5 — FSBO ranking boost */
  rankingBoost: boolean;
  /** Phase 5 — trust-aware broker / mortgage routing */
  leadRouting: boolean;
  /** Phase 5 — BNHub host/guest/booking pipelines */
  bnhubRisk: boolean;
  /** Phase 5 — investor opportunity filters */
  investorFilters: boolean;
  /** Phase 5 — mortgage readiness autopilot */
  mortgageAutopilot: boolean;
  /** Phase 6 — document AI extraction (evidence enhancer) */
  docExtraction: boolean;
  /** Phase 6 — geospatial / address validation scaffolding */
  geospatialValidation: boolean;
  /** Phase 6 — media scene classification */
  mediaClassification: boolean;
  /** Phase 6 — anti-fraud graph */
  antifraudGraph: boolean;
  /** Phase 6 — premium placement / pricing policy */
  premiumPlacement: boolean;
  /** Phase 7 — brokerage / enterprise compliance workspaces */
  enterpriseWorkspaces: boolean;
  /** Phase 7 — legal SLA queues */
  legalSla: boolean;
  /** Phase 7 — white-label trust dashboards */
  whiteLabelDashboards: boolean;
  /** Phase 7 — portfolio trust analytics */
  portfolioAnalytics: boolean;
  /** Phase 7 — document approval workflows */
  documentApprovals: boolean;
  /** Phase 8 — TrustGraph billing / subscriptions */
  billing: boolean;
  /** Phase 8 — compliance recertification */
  recertification: boolean;
  /** Phase 8 — regulator audit exports */
  auditExports: boolean;
  /** Phase 8 — cross-border compliance rulesets */
  complianceRulesets: boolean;
  /** Phase 8 — external partner API */
  externalApi: boolean;
};

export function getTrustGraphFeatureFlags(): TrustGraphFeatureFlags {
  const enabled = parseTruthy(process.env.TRUSTGRAPH_ENABLED);
  return {
    enabled,
    adminQueue: enabled && subFeatureTruthy("TRUSTGRAPH_ADMIN_QUEUE_ENABLED"),
    listingBadge: enabled && subFeatureTruthy("TRUSTGRAPH_LISTING_BADGE_ENABLED"),
    brokerBadge: enabled && subFeatureTruthy("TRUSTGRAPH_BROKER_BADGE_ENABLED"),
    declarationWidget: enabled && subFeatureTruthy("TRUSTGRAPH_DECLARATION_WIDGET_ENABLED"),
    rankingBoost: enabled && phase5Truthy("TRUSTGRAPH_RANKING_BOOST_ENABLED"),
    leadRouting: enabled && phase5Truthy("TRUSTGRAPH_LEAD_ROUTING_ENABLED"),
    bnhubRisk: enabled && phase5Truthy("TRUSTGRAPH_BNHUB_RISK_ENABLED"),
    investorFilters: enabled && phase5Truthy("TRUSTGRAPH_INVESTOR_FILTERS_ENABLED"),
    mortgageAutopilot: enabled && phase5Truthy("TRUSTGRAPH_MORTGAGE_AUTOPILOT_ENABLED"),
    docExtraction: enabled && phase6Truthy("TRUSTGRAPH_DOC_EXTRACTION_ENABLED"),
    geospatialValidation: enabled && phase6Truthy("TRUSTGRAPH_GEOSPATIAL_VALIDATION_ENABLED"),
    mediaClassification: enabled && phase6Truthy("TRUSTGRAPH_MEDIA_CLASSIFICATION_ENABLED"),
    antifraudGraph: enabled && phase6Truthy("TRUSTGRAPH_ANTIFRAUD_GRAPH_ENABLED"),
    premiumPlacement: enabled && phase6Truthy("TRUSTGRAPH_PREMIUM_PLACEMENT_ENABLED"),
    enterpriseWorkspaces: enabled && phase7Truthy("TRUSTGRAPH_ENTERPRISE_WORKSPACES_ENABLED"),
    legalSla: enabled && phase7Truthy("TRUSTGRAPH_LEGAL_SLA_ENABLED"),
    whiteLabelDashboards: enabled && phase7Truthy("TRUSTGRAPH_WHITE_LABEL_DASHBOARDS_ENABLED"),
    portfolioAnalytics: enabled && phase7Truthy("TRUSTGRAPH_PORTFOLIO_ANALYTICS_ENABLED"),
    documentApprovals: enabled && phase7Truthy("TRUSTGRAPH_DOCUMENT_APPROVALS_ENABLED"),
    billing: enabled && phase8Truthy("TRUSTGRAPH_BILLING_ENABLED"),
    recertification: enabled && phase8Truthy("TRUSTGRAPH_RECERTIFICATION_ENABLED"),
    auditExports: enabled && phase8Truthy("TRUSTGRAPH_AUDIT_EXPORTS_ENABLED"),
    complianceRulesets: enabled && phase8Truthy("TRUSTGRAPH_COMPLIANCE_RULESETS_ENABLED"),
    externalApi: enabled && phase8Truthy("TRUSTGRAPH_EXTERNAL_API_ENABLED"),
  };
}

export function isTrustGraphEnabled(): boolean {
  return getTrustGraphFeatureFlags().enabled;
}

export function isTrustGraphAdminQueueEnabled(): boolean {
  return getTrustGraphFeatureFlags().adminQueue;
}

export function isTrustGraphListingBadgeEnabled(): boolean {
  return getTrustGraphFeatureFlags().listingBadge;
}

export function isTrustGraphBrokerBadgeEnabled(): boolean {
  return getTrustGraphFeatureFlags().brokerBadge;
}

export function isTrustGraphDeclarationWidgetEnabled(): boolean {
  return getTrustGraphFeatureFlags().declarationWidget;
}

export function isTrustGraphRankingBoostEnabled(): boolean {
  return getTrustGraphFeatureFlags().rankingBoost;
}

export function isTrustGraphLeadRoutingEnabled(): boolean {
  return getTrustGraphFeatureFlags().leadRouting;
}

export function isTrustGraphBnhubRiskEnabled(): boolean {
  return getTrustGraphFeatureFlags().bnhubRisk;
}

export function isTrustGraphInvestorFiltersEnabled(): boolean {
  return getTrustGraphFeatureFlags().investorFilters;
}

export function isTrustGraphMortgageAutopilotEnabled(): boolean {
  return getTrustGraphFeatureFlags().mortgageAutopilot;
}

export function isTrustGraphDocExtractionEnabled(): boolean {
  return getTrustGraphFeatureFlags().docExtraction;
}

export function isTrustGraphGeospatialValidationEnabled(): boolean {
  return getTrustGraphFeatureFlags().geospatialValidation;
}

export function isTrustGraphMediaClassificationEnabled(): boolean {
  return getTrustGraphFeatureFlags().mediaClassification;
}

export function isTrustGraphAntifraudGraphEnabled(): boolean {
  return getTrustGraphFeatureFlags().antifraudGraph;
}

export function isTrustGraphPremiumPlacementEnabled(): boolean {
  return getTrustGraphFeatureFlags().premiumPlacement;
}

export function isTrustGraphEnterpriseWorkspacesEnabled(): boolean {
  return getTrustGraphFeatureFlags().enterpriseWorkspaces;
}

export function isTrustGraphLegalSlaEnabled(): boolean {
  return getTrustGraphFeatureFlags().legalSla;
}

export function isTrustGraphWhiteLabelDashboardsEnabled(): boolean {
  return getTrustGraphFeatureFlags().whiteLabelDashboards;
}

export function isTrustGraphPortfolioAnalyticsEnabled(): boolean {
  return getTrustGraphFeatureFlags().portfolioAnalytics;
}

export function isTrustGraphDocumentApprovalsEnabled(): boolean {
  return getTrustGraphFeatureFlags().documentApprovals;
}

export function isTrustGraphBillingEnabled(): boolean {
  return getTrustGraphFeatureFlags().billing;
}

export function isTrustGraphRecertificationEnabled(): boolean {
  return getTrustGraphFeatureFlags().recertification;
}

export function isTrustGraphAuditExportsEnabled(): boolean {
  return getTrustGraphFeatureFlags().auditExports;
}

export function isTrustGraphComplianceRulesetsEnabled(): boolean {
  return getTrustGraphFeatureFlags().complianceRulesets;
}

export function isTrustGraphExternalApiEnabled(): boolean {
  return getTrustGraphFeatureFlags().externalApi;
}
