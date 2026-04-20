import { describe, expect, it } from "vitest";
import { buildListingExplanation } from "../explainability-builder.service";
import type { MarketplaceSignal, ObservationSnapshot, Opportunity, PolicyDecision, ProposedAction } from "../../types/domain.types";

const obs = (partial?: Partial<ObservationSnapshot>): ObservationSnapshot => ({
  id: "obs_1",
  target: { type: "fsbo_listing", id: "lst_1", label: "x" },
  signals: [],
  aggregates: {},
  facts: { preview: true },
  builtAt: "2026-04-02T12:00:00.000Z",
  ...partial,
});

const mkSignal = (id: string): MarketplaceSignal => ({
  id,
  signalType: "listing_performance",
  observedAt: "2026-04-02T12:00:00.000Z",
  source: "unit",
  confidence: 0.8,
  explanation: "Listing performance baseline.",
  metadata: { listingId: "lst_1", views: 10, daysOnMarket: 50 },
});

const mkOpp = (id: string): Opportunity => ({
  id,
  detectorId: "stale_listing",
  title: "Stale inventory",
  explanation: "Long time on market.",
  confidence: 0.7,
  risk: "LOW",
  evidence: {},
  proposedActions: [],
  createdAt: "2026-04-02T12:00:00.000Z",
});

const mkAction = (id: string, oppId: string): ProposedAction => ({
  id,
  type: "FLAG_REVIEW",
  target: { type: "fsbo_listing", id: "lst_1" },
  confidence: 0.6,
  risk: "LOW",
  title: "Review listing",
  explanation: "Schedule review",
  humanReadableSummary: "Review",
  metadata: {},
  suggestedAt: "2026-04-02T12:00:00.000Z",
  sourceDetectorId: "stale_listing",
  opportunityId: oppId,
});

const mkPolicy = (actionId: string): PolicyDecision => ({
  id: `p_${actionId}`,
  actionId,
  disposition: "ALLOW_DRY_RUN",
  violations: [],
  warnings: [],
  evaluatedAt: "2026-04-02T12:00:00.000Z",
  ruleResults: [{ ruleCode: "target_active", result: "passed" }],
});

describe("explainability-builder.service", () => {
  it("builds summary and bounded graph", () => {
    const sig = mkSignal("s1");
    const opp = mkOpp("o1");
    const pa = mkAction("a1", "o1");
    opp.proposedActions = [pa];
    const pol = mkPolicy("a1");

    const ex = buildListingExplanation({
      listingId: "lst_1",
      signals: [sig],
      opportunities: [opp],
      policyDecisions: [pol],
      proposedActions: [pa],
      observation: obs(),
      level: "detailed",
    });

    expect(ex.listingId).toBe("lst_1");
    expect(ex.summary.length).toBeGreaterThan(20);
    expect(ex.keyFindings.length).toBeGreaterThan(0);
    expect(ex.recommendations.length).toBeGreaterThan(0);
    expect(ex.graph.nodes.length).toBeLessThanOrEqual(20);
    expect(ex.graph.edges.length).toBeLessThanOrEqual(30);
  });

  it("links opportunity to policy and policy to action", () => {
    const opp = mkOpp("o1");
    const pa = mkAction("act_x", "o1");
    opp.proposedActions = [pa];
    const pol = mkPolicy("act_x");

    const ex = buildListingExplanation({
      listingId: "lst_1",
      signals: [],
      opportunities: [opp],
      policyDecisions: [pol],
      proposedActions: [pa],
      observation: obs(),
      level: "simple",
    });

    const polNode = `pol_${pol.id}`;
    const fromOpp = ex.graph.edges.some((e) => e.from === "opp_o1" && e.to === polNode);
    const toAct = ex.graph.edges.some((e) => e.from === polNode && e.to === "act_act_x");
    expect(fromOpp).toBe(true);
    expect(toAct).toBe(true);
  });

  it("is deterministic for fixed inputs", () => {
    const sig = mkSignal("s_fixed");
    const opp = mkOpp("o_fix");
    const pa = mkAction("a_fix", "o_fix");
    opp.proposedActions = [pa];

    const params = {
      listingId: "lst_fix",
      signals: [sig],
      opportunities: [opp],
      policyDecisions: [mkPolicy("a_fix")],
      proposedActions: [pa],
      observation: obs({ id: "obs_fix" }),
      level: "detailed" as const,
    };

    const a = buildListingExplanation(params);
    const b = buildListingExplanation(params);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("does not throw on empty inputs", () => {
    expect(() =>
      buildListingExplanation({
        listingId: "x",
        signals: [],
        opportunities: [],
        policyDecisions: [],
        proposedActions: [],
        observation: obs({ facts: {} }),
        level: "simple",
      }),
    ).not.toThrow();
  });
});
