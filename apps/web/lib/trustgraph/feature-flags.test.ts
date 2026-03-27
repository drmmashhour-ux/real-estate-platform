import { describe, expect, it, afterEach } from "vitest";
import { getTrustGraphFeatureFlags } from "./feature-flags";

describe("getTrustGraphFeatureFlags", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("defaults all off when unset", () => {
    delete process.env.TRUSTGRAPH_ENABLED;
    delete process.env.TRUSTGRAPH_ADMIN_QUEUE_ENABLED;
    const f = getTrustGraphFeatureFlags();
    expect(f.enabled).toBe(false);
    expect(f.adminQueue).toBe(false);
    expect(f.listingBadge).toBe(false);
    expect(f.brokerBadge).toBe(false);
    expect(f.declarationWidget).toBe(false);
    expect(f.rankingBoost).toBe(false);
    expect(f.leadRouting).toBe(false);
    expect(f.bnhubRisk).toBe(false);
    expect(f.investorFilters).toBe(false);
    expect(f.mortgageAutopilot).toBe(false);
    expect(f.docExtraction).toBe(false);
    expect(f.geospatialValidation).toBe(false);
    expect(f.mediaClassification).toBe(false);
    expect(f.antifraudGraph).toBe(false);
    expect(f.premiumPlacement).toBe(false);
    expect(f.enterpriseWorkspaces).toBe(false);
    expect(f.legalSla).toBe(false);
    expect(f.whiteLabelDashboards).toBe(false);
    expect(f.portfolioAnalytics).toBe(false);
    expect(f.documentApprovals).toBe(false);
    expect(f.billing).toBe(false);
    expect(f.recertification).toBe(false);
    expect(f.auditExports).toBe(false);
    expect(f.complianceRulesets).toBe(false);
    expect(f.externalApi).toBe(false);
  });

  it("sub-features require master enabled", () => {
    process.env.TRUSTGRAPH_ENABLED = "false";
    process.env.TRUSTGRAPH_ADMIN_QUEUE_ENABLED = "true";
    process.env.TRUSTGRAPH_LISTING_BADGE_ENABLED = "true";
    const f = getTrustGraphFeatureFlags();
    expect(f.enabled).toBe(false);
    expect(f.adminQueue).toBe(false);
    expect(f.listingBadge).toBe(false);
  });

  it("enables sub-features when master and flags are true", () => {
    process.env.TRUSTGRAPH_ENABLED = "1";
    process.env.TRUSTGRAPH_ADMIN_QUEUE_ENABLED = "true";
    process.env.TRUSTGRAPH_LISTING_BADGE_ENABLED = "yes";
    process.env.TRUSTGRAPH_BROKER_BADGE_ENABLED = "on";
    process.env.TRUSTGRAPH_DECLARATION_WIDGET_ENABLED = "1";
    const f = getTrustGraphFeatureFlags();
    expect(f.enabled).toBe(true);
    expect(f.adminQueue).toBe(true);
    expect(f.listingBadge).toBe(true);
    expect(f.brokerBadge).toBe(true);
    expect(f.declarationWidget).toBe(true);
  });

  it("when master is on, sub-features default on if sub env vars are unset", () => {
    process.env.TRUSTGRAPH_ENABLED = "true";
    delete process.env.TRUSTGRAPH_ADMIN_QUEUE_ENABLED;
    delete process.env.TRUSTGRAPH_LISTING_BADGE_ENABLED;
    delete process.env.TRUSTGRAPH_BROKER_BADGE_ENABLED;
    delete process.env.TRUSTGRAPH_DECLARATION_WIDGET_ENABLED;
    const f = getTrustGraphFeatureFlags();
    expect(f.enabled).toBe(true);
    expect(f.adminQueue).toBe(true);
    expect(f.listingBadge).toBe(true);
    expect(f.brokerBadge).toBe(true);
    expect(f.declarationWidget).toBe(true);
    expect(f.rankingBoost).toBe(false);
    expect(f.leadRouting).toBe(false);
  });

  it("phase 5 flags require explicit env when master is on", () => {
    process.env.TRUSTGRAPH_ENABLED = "true";
    process.env.TRUSTGRAPH_RANKING_BOOST_ENABLED = "true";
    process.env.TRUSTGRAPH_LEAD_ROUTING_ENABLED = "1";
    const f = getTrustGraphFeatureFlags();
    expect(f.rankingBoost).toBe(true);
    expect(f.leadRouting).toBe(true);
    expect(f.bnhubRisk).toBe(false);
    delete process.env.TRUSTGRAPH_RANKING_BOOST_ENABLED;
    delete process.env.TRUSTGRAPH_LEAD_ROUTING_ENABLED;
  });

  it("phase 6 flags require explicit env when master is on", () => {
    process.env.TRUSTGRAPH_ENABLED = "true";
    delete process.env.TRUSTGRAPH_DOC_EXTRACTION_ENABLED;
    const f = getTrustGraphFeatureFlags();
    expect(f.docExtraction).toBe(false);
    process.env.TRUSTGRAPH_DOC_EXTRACTION_ENABLED = "true";
    process.env.TRUSTGRAPH_GEOSPATIAL_VALIDATION_ENABLED = "1";
    const f2 = getTrustGraphFeatureFlags();
    expect(f2.docExtraction).toBe(true);
    expect(f2.geospatialValidation).toBe(true);
    delete process.env.TRUSTGRAPH_DOC_EXTRACTION_ENABLED;
    delete process.env.TRUSTGRAPH_GEOSPATIAL_VALIDATION_ENABLED;
  });

  it("phase 7 flags require explicit env when master is on", () => {
    process.env.TRUSTGRAPH_ENABLED = "true";
    delete process.env.TRUSTGRAPH_ENTERPRISE_WORKSPACES_ENABLED;
    const f = getTrustGraphFeatureFlags();
    expect(f.enterpriseWorkspaces).toBe(false);
    process.env.TRUSTGRAPH_ENTERPRISE_WORKSPACES_ENABLED = "true";
    process.env.TRUSTGRAPH_LEGAL_SLA_ENABLED = "1";
    const f2 = getTrustGraphFeatureFlags();
    expect(f2.enterpriseWorkspaces).toBe(true);
    expect(f2.legalSla).toBe(true);
    delete process.env.TRUSTGRAPH_ENTERPRISE_WORKSPACES_ENABLED;
    delete process.env.TRUSTGRAPH_LEGAL_SLA_ENABLED;
  });

  it("phase 8 flags require explicit env when master is on", () => {
    process.env.TRUSTGRAPH_ENABLED = "true";
    delete process.env.TRUSTGRAPH_BILLING_ENABLED;
    expect(getTrustGraphFeatureFlags().billing).toBe(false);
    process.env.TRUSTGRAPH_BILLING_ENABLED = "true";
    process.env.TRUSTGRAPH_EXTERNAL_API_ENABLED = "1";
    const f = getTrustGraphFeatureFlags();
    expect(f.billing).toBe(true);
    expect(f.externalApi).toBe(true);
    delete process.env.TRUSTGRAPH_BILLING_ENABLED;
    delete process.env.TRUSTGRAPH_EXTERNAL_API_ENABLED;
  });

  it("allows disabling a sub-feature when master is on", () => {
    process.env.TRUSTGRAPH_ENABLED = "true";
    process.env.TRUSTGRAPH_ADMIN_QUEUE_ENABLED = "false";
    const f = getTrustGraphFeatureFlags();
    expect(f.adminQueue).toBe(false);
    expect(f.listingBadge).toBe(true);
  });
});
