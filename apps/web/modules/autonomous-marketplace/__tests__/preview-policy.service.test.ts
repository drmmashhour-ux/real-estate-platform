import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildPolicyContext } from "../execution/policy-context-builder";
import { evaluateListingPreviewPolicy } from "../policy/preview-policy.service";
import type { ObservationSnapshot, Opportunity, ProposedAction } from "../types/domain.types";

vi.mock("../policy/policy-engine", () => ({
  evaluateListingPreviewPolicyFromContext: vi.fn().mockReturnValue({
    id: "p1",
    actionId: "a1",
    disposition: "ALLOW",
    violations: [],
    warnings: [],
    evaluatedAt: "2026-01-01T00:00:00.000Z",
    ruleResults: [{ ruleCode: "stub_rule", result: "passed" as const, reason: "ok" }],
  }),
}));

vi.mock("../execution/policy-context-builder", () => ({
  buildPolicyContext: vi.fn().mockResolvedValue({}),
}));

function baseAction(overrides: Partial<ProposedAction> = {}): ProposedAction {
  return {
    id: "pa1",
    type: "UPDATE_LISTING_COPY",
    target: { type: "fsbo_listing", id: "list-1" },
    confidence: 0.9,
    risk: "LOW",
    title: "t",
    explanation: "e",
    humanReadableSummary: "h",
    metadata: {},
    suggestedAt: "2026-01-01T00:00:00.000Z",
    sourceDetectorId: "det",
    opportunityId: "opp1",
    ...overrides,
  };
}

describe("evaluateListingPreviewPolicy", () => {
  it("returns one decorated decision per proposed action without throwing", async () => {
    const pa = baseAction();
    const opp: Opportunity = {
      id: "opp1",
      detectorId: "det",
      title: "T",
      explanation: "e",
      confidence: 0.9,
      risk: "LOW",
      evidence: {},
      proposedActions: [pa],
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const observation: ObservationSnapshot = {
      id: "obs",
      target: { type: "fsbo_listing", id: "list-1" },
      signals: [],
      aggregates: {},
      facts: {
        priceCents: 100,
        status: "ACTIVE",
        moderationStatus: "APPROVED",
      },
      builtAt: "2026-01-01T00:00:00.000Z",
    };

    const decisions = await evaluateListingPreviewPolicy({
      listingId: "list-1",
      observation,
      opportunities: [opp],
      proposedActions: [pa],
      autonomyMode: "OFF",
    });

    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.ruleResults.some((r) => r.ruleCode === "preview_pipeline_disposition")).toBe(true);
  });

  it("returns empty array on inner failure without throwing", async () => {
    vi.mocked(buildPolicyContext).mockRejectedValueOnce(new Error("fail"));

    const decisions = await evaluateListingPreviewPolicy({
      listingId: "x",
      observation: {
        id: "o",
        target: { type: "fsbo_listing", id: "x" },
        signals: [],
        aggregates: {},
        facts: {},
        builtAt: "2026-01-01T00:00:00.000Z",
      },
      opportunities: [],
      proposedActions: [baseAction()],
      autonomyMode: "OFF",
    });

    expect(decisions).toEqual([]);
  });

  it("low confidence adds caution disposition deterministically", async () => {
    const pa = baseAction({ confidence: 0.1 });
    const observation: ObservationSnapshot = {
      id: "obs",
      target: { type: "fsbo_listing", id: "list-1" },
      signals: [],
      aggregates: {},
      facts: {
        priceCents: 100,
        status: "ACTIVE",
        moderationStatus: "APPROVED",
      },
      builtAt: "2026-01-01T00:00:00.000Z",
    };

    const d = await evaluateListingPreviewPolicy({
      listingId: "list-1",
      observation,
      opportunities: [],
      proposedActions: [pa],
      autonomyMode: "OFF",
    });

    const pipe = d[0]?.ruleResults.find((r) => r.ruleCode === "preview_pipeline_disposition");
    expect(pipe?.reason).toContain("caution");
  });
});
