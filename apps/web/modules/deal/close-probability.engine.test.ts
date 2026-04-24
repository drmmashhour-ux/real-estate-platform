import { describe, expect, it } from "vitest";
import { computeCloseProbability, categoryFromProbability } from "./close-probability.engine";
import type { ScoreInputs } from "./deal-score.calculator";

const baseInputs = (over: Partial<ScoreInputs> = {}): ScoreInputs => ({
  status: "accepted",
  dealPriceCad: 500_000,
  listPriceCad: 510_000,
  lastActivityAt: new Date("2026-04-01"),
  now: new Date("2026-04-10"),
  activeDays14d: 4,
  events14d: 6,
  visitOrMessageEvents14d: 3,
  milestoneCompleted: 2,
  milestoneTotal: 5,
  negotiationRoundMax: 1,
  rejectedProposals: 0,
  ...over,
});

describe("close-probability.engine", () => {
  it("maps probability to categories", () => {
    expect(categoryFromProbability(82)).toBe("VERY_HIGH");
    expect(categoryFromProbability(65)).toBe("HIGH");
    expect(categoryFromProbability(45)).toBe("MEDIUM");
    expect(categoryFromProbability(30)).toBe("LOW");
  });

  it("returns drivers and risks for a healthy in-progress deal", () => {
    const r = computeCloseProbability({
      status: "financing",
      crmStage: "negotiation",
      dealCreatedAt: new Date("2026-01-01"),
      now: new Date("2026-04-10"),
      scoreInputs: baseInputs(),
      listPriceGapPct: 2,
      daysSinceLastActivity: 4,
      hasBrokerExecutionApproval: true,
      closingDocuments: { required: 4, verified: 3, uploaded: 1, missing: 0, rejected: 0 },
      checklist: { total: 4, complete: 3, blocked: 0 },
      closingConditions: { pending: 1, overdue: 0 },
      targetClosingDate: new Date("2026-05-15"),
      dealDocumentsCount: 3,
    });
    expect(r.probability).toBeGreaterThanOrEqual(40);
    expect(r.probability).toBeLessThanOrEqual(100);
    expect(r.drivers.length + r.risks.length).toBeGreaterThan(0);
  });

  it("forces low score for cancelled deals", () => {
    const r = computeCloseProbability({
      status: "cancelled",
      crmStage: null,
      dealCreatedAt: new Date("2026-01-01"),
      now: new Date("2026-04-10"),
      scoreInputs: baseInputs({ status: "cancelled" }),
      listPriceGapPct: null,
      daysSinceLastActivity: 40,
      hasBrokerExecutionApproval: false,
      closingDocuments: { required: 0, verified: 0, uploaded: 0, missing: 0, rejected: 0 },
      checklist: { total: 0, complete: 0, blocked: 0 },
      closingConditions: { pending: 0, overdue: 0 },
      targetClosingDate: null,
      dealDocumentsCount: 0,
    });
    expect(r.category).toBe("LOW");
    expect(r.probability).toBeLessThanOrEqual(10);
  });
});
