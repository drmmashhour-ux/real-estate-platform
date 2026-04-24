import { describe, expect, it } from "vitest";
import type { CommandCenterPagePayload } from "../command-center.types";
import type { UnifiedCommandContext } from "../command-center-ai.types";
import { buildCommandAlerts } from "../command-center-alert.engine";
import { buildCommandPriorities } from "../command-center-priority.engine";
import { buildCommandRecommendations } from "../command-center-recommendation.engine";

function minimalLegacy(): CommandCenterPagePayload {
  return {
    summary: {
      executive: {
        revenueDisplay: "$0",
        revenueTrend: "healthy",
        revenueHint: "",
        activeDeals: 2,
        dealsTrend: "healthy",
        bookedVisits: 0,
        visitsTrend: "healthy",
        conversionRateDisplay: "0%",
        conversionTrend: "healthy",
        trustScore: 80,
        trustBand: "strong",
        trustTrend: "healthy",
        automationDisplay: "12%",
        automationTrend: "healthy",
      },
      revenueGrowthHint: "",
      priorityDeals: [
        {
          id: "deal-p1",
          label: "123 Main",
          stage: "active",
          priceCents: 500_000_00,
          score: 88,
          riskHint: "Listing may be underpriced vs comps",
          updatedAt: new Date().toISOString(),
        },
      ],
      stalledDeals: [],
      hotLeads: [],
      followUpLeads: [],
      trustRisk: {
        trustScore: 80,
        trustBand: "strong",
        disputeRiskScore: 10,
        openDisputes: 0,
        complianceNotes: ["Supervision log pending for one file"],
        topIssues: [],
        sharpestDrops: [],
        remediationLinks: [],
      },
      marketing: {
        scheduledHint: "",
        campaignHint: "",
        expansionHint: "",
        territoryOpportunity: "",
        nextMove: "",
        links: [],
      },
      generatedAt: new Date().toISOString(),
    },
    feed: [],
    intelligenceFeed: [],
    alerts: [{ id: "a1", kind: "approval", title: "Urgent trust review", severity: "urgent", href: "/x", createdAt: new Date().toISOString() }],
    signals: [],
    signalsPrimary: [],
    signalsByZone: { critical: [], attention: [], healthy: [] },
    marketplaceHealth: {
      overallLevel: "healthy",
      headline: "",
      trustScore: 80,
      trustBand: "strong",
      disputeRiskScore: 10,
      openDisputes: 0,
      biggestRisks: [],
      biggestImprovements: [],
      quickActions: [],
    },
    strategicRecommendations: [
      {
        id: "sr1",
        title: "Tighten follow-up cadence",
        explanation: "Stale leads in buy box",
        expectedImpact: "Higher conversion",
        actions: [{ id: "1", label: "Open leads", kind: "navigate", href: "/leads" }],
        source: { engine: "aggregated" },
        requiresApproval: false,
      },
    ],
    systemPerformance: null,
    role: "BROKER",
    viewMode: "broker",
    generatedAt: new Date().toISOString(),
  };
}

function baseContext(over: Partial<UnifiedCommandContext> = {}): UnifiedCommandContext {
  return {
    userId: "broker-1",
    role: "BROKER",
    generatedAt: new Date().toISOString(),
    legacy: minimalLegacy(),
    signatureQueue: [],
    execution: { aiHandled: [], failedOrBlocked: [] },
    deals: [],
    closings: [],
    investors: [],
    finance: { invoicesOpen: 0, invoicesOverdue: 0, recentInvoices: [], taxHint: null },
    hotOpportunities: [],
    conflictDeals: 0,
    ...over,
  };
}

describe("command-center AI engines", () => {
  it("buildCommandPriorities puts conflict + critical signature in ACT_NOW", () => {
    const priorities = buildCommandPriorities(
      baseContext({
        conflictDeals: 1,
        signatureQueue: [
          {
            kind: "action_pipeline",
            id: "p1",
            title: "Autopilot ready",
            dealId: "d1",
            href: "/dashboard/signature-center",
            severity: "CRITICAL",
          },
        ],
      }),
    );
    expect(priorities.ACT_NOW.length).toBeGreaterThan(0);
    expect(priorities.ACT_NOW.some((x) => x.id.startsWith("sig:"))).toBe(true);
    expect(priorities.ACT_NOW.some((x) => x.id === "compliance:conflict-deals")).toBe(true);
  });

  it("buildCommandAlerts surfaces compliance and approval alerts", () => {
    const alerts = buildCommandAlerts(
      baseContext({
        conflictDeals: 1,
        deals: [
          {
            dealId: "d-conf",
            dealCode: "D-9",
            stage: "CONFLICT_REQUIRES_DISCLOSURE",
            crmStage: null,
            priceCents: 1_000_000_00,
            dealScore: 70,
            dealScoreCategory: null,
            riskLevel: "HIGH",
            closeProbability: 0.5,
            closeCategory: null,
            blocker: "Conflict disclosure unresolved",
            nextStep: "Disclose",
            nextOwner: "Broker",
            needsBrokerSignature: false,
            href: "/deal",
          },
        ],
        signatureQueue: [
          {
            kind: "offer",
            id: "o1",
            title: "Offer draft",
            dealId: null,
            href: "/contracts",
            severity: "HIGH",
          },
        ],
      }),
    );
    expect(alerts.some((a) => a.type === "COMPLIANCE" && a.severity === "CRITICAL")).toBe(true);
    expect(alerts.some((a) => a.type === "APPROVAL")).toBe(true);
  });

  it("buildCommandRecommendations are ordered by score and include reasoning fields", () => {
    const context = baseContext({
      signatureQueue: [
        {
          kind: "action_pipeline",
          id: "p1",
          title: "Sign autopilot",
          dealId: "d1",
          href: "/signature",
          severity: "CRITICAL",
        },
      ],
    });
    const priorities = buildCommandPriorities(context);
    const recs = buildCommandRecommendations(context, priorities);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]?.score).toBeGreaterThanOrEqual(recs[recs.length - 1]?.score ?? 0);
    for (const r of recs) {
      expect(r.reasoningJson.why.length).toBeGreaterThan(0);
      expect(r.reasoningJson.expectedImpact.length).toBeGreaterThan(0);
      expect(r.reasoningJson.riskOrBlocker.length).toBeGreaterThan(0);
      expect(Array.isArray(r.reasoningJson.explainability)).toBe(true);
    }
  });

  it("aggregated context includes finance and tax reminder alerts (no silent gaps)", () => {
    const alerts = buildCommandAlerts(baseContext({}));
    expect(alerts.some((a) => a.entityType === "tax_calendar")).toBe(true);
    expect(alerts.some((a) => a.entityType === "regulatory_calendar")).toBe(true);
  });
});
