import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildGrowthHumanReviewQueue } from "../growth-governance-escalation.service";
import type { GrowthGovernanceContext, GrowthGovernanceDecision } from "../growth-governance.types";

const esc = vi.hoisted(() => ({ escalation: true }));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...mod,
    growthGovernanceFlags: new Proxy(mod.growthGovernanceFlags, {
      get(target, prop, receiver) {
        if (prop === "growthGovernanceEscalationV1") return esc.escalation;
        return Reflect.get(target, prop, receiver);
      },
    }),
  };
});

beforeEach(() => {
  esc.escalation = true;
});

describe("buildGrowthHumanReviewQueue", () => {
  const decision: Pick<GrowthGovernanceDecision, "status" | "topRisks"> = {
    status: "human_review_required",
    topRisks: [
      {
        id: "r1",
        category: "leads",
        severity: "high",
        title: "Queue pressure",
        description: "d",
        reason: "r",
      },
    ],
  };

  const ctx: GrowthGovernanceContext = {
    leadsToday: 0,
    totalEarlyConversionLeads: 20,
    campaignsAttributed: 4,
    adsInsightsProblems: ["a", "b"],
    adsHealth: "WEAK",
    weakCampaignDominant: true,
    autopilotRejected: 4,
    autopilotPending: 2,
    followUpHighIntentQueued: 6,
    followUpDueNowCount: 0,
    fusionSummaryStatus: null,
    fusionSnapshotWarnings: 4,
    manualOnlyAutopilotCount: 7,
    contentAssistEnabled: true,
    messagingAssistEnabled: false,
    governanceWarnings: [],
  };

  it("returns empty when escalation flag off", () => {
    esc.escalation = false;
    expect(buildGrowthHumanReviewQueue(decision, ctx)).toEqual([]);
  });

  it("includes context-driven items when escalation on", () => {
    esc.escalation = true;
    const q = buildGrowthHumanReviewQueue(decision, ctx);
    expect(q.length).toBeGreaterThan(0);
    expect(q.some((x) => /autopilot|follow-up/i.test(x.title))).toBe(true);
    expect(q.every((x) => x.id && x.reason)).toBe(true);
  });

  it("does not mutate decision", () => {
    const copy = JSON.stringify(decision);
    buildGrowthHumanReviewQueue(decision, ctx);
    expect(JSON.stringify(decision)).toBe(copy);
  });
});
