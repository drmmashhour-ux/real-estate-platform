/**
 * TrustGraph — tunables and re-exports.
 * Feature flags live in `./feature-flags.ts` (single source of truth).
 */
export {
  getTrustGraphFeatureFlags,
  isTrustGraphAdminQueueEnabled,
  isTrustGraphBnhubRiskEnabled,
  isTrustGraphBrokerBadgeEnabled,
  isTrustGraphDeclarationWidgetEnabled,
  isTrustGraphEnabled,
  isTrustGraphInvestorFiltersEnabled,
  isTrustGraphLeadRoutingEnabled,
  isTrustGraphListingBadgeEnabled,
  isTrustGraphMortgageAutopilotEnabled,
  isTrustGraphRankingBoostEnabled,
  isTrustGraphDocExtractionEnabled,
  isTrustGraphGeospatialValidationEnabled,
  isTrustGraphMediaClassificationEnabled,
  isTrustGraphAntifraudGraphEnabled,
  isTrustGraphPremiumPlacementEnabled,
  isTrustGraphEnterpriseWorkspacesEnabled,
  isTrustGraphLegalSlaEnabled,
  isTrustGraphWhiteLabelDashboardsEnabled,
  isTrustGraphPortfolioAnalyticsEnabled,
  isTrustGraphDocumentApprovalsEnabled,
  isTrustGraphBillingEnabled,
  isTrustGraphRecertificationEnabled,
  isTrustGraphAuditExportsEnabled,
  isTrustGraphComplianceRulesetsEnabled,
  isTrustGraphExternalApiEnabled,
  type TrustGraphFeatureFlags,
} from "./feature-flags";

export { getPhase5GrowthConfig, type Phase5GrowthConfig } from "./config/phase5-growth";
export { getPhase6MoatConfig, type Phase6MoatConfig } from "./config/phase6-moat";
export { getPhase7EnterpriseConfig, type Phase7EnterpriseConfig } from "./config/phase7-enterprise";
export { getPhase8PlatformConfig, type Phase8PlatformConfig } from "./config/phase8-platform";

export const TRUSTGRAPH_RULE_VERSION = "1.0.0";
