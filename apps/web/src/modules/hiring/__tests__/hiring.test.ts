import { describe, expect, it, vi, beforeEach } from "vitest";
import { computePerformanceFlag } from "../decisionRules";
import { computeEvaluationScores } from "../scoring";
import { createCandidate, evaluateCandidate, logInteraction } from "../pipeline";

describe("hiring scoring", () => {
  it("computeEvaluationScores averages four pillars", () => {
    const s = computeEvaluationScores({ communication: 8, speed: 6, clarity: 7, closing: 9 });
    expect(s.overallScore).toBeCloseTo(7.5, 5);
    expect(s.salesSkillScore).toBe(9);
    expect(s.executionScore).toBe(Math.round((6 + 7) / 2));
  });

  it("clamps to 0–10", () => {
    const s = computeEvaluationScores({ communication: 15, speed: -1, clarity: 3, closing: 4 });
    expect(s.communicationScore).toBe(10);
    expect(s.speedScore).toBe(0);
  });
});

describe("hiring decision rules", () => {
  it("flags high performer in trial with strong score", () => {
    expect(computePerformanceFlag(8.5, "trial")).toBe("high_performer");
  });
  it("flags low performer", () => {
    expect(computePerformanceFlag(4, "screening")).toBe("low_performer");
  });
  it("clears flags for terminal stages", () => {
    expect(computePerformanceFlag(9, "hired")).toBeNull();
  });
});

vi.mock("@/lib/db", () => ({
  prisma: {
    candidate: { create: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn() },
    candidateInteraction: { create: vi.fn() },
    candidateEvaluation: { create: vi.fn() },
    $transaction: vi.fn((fn: (tx: unknown) => unknown) =>
      fn({
        candidateEvaluation: { create: vi.fn().mockResolvedValue({ id: "e1" }) },
        candidate: {
          findUniqueOrThrow: vi.fn().mockResolvedValue({ stage: "interview" }),
          update: vi.fn().mockResolvedValue({}),
        },
      })
    ),
  },
}));

import { prisma } from "@/lib/db";

describe("hiring pipeline (simulated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createCandidate validates role", async () => {
    vi.mocked(prisma.candidate.create).mockResolvedValue({} as never);
    await createCandidate({ name: "A", email: "a@b.com", role: "sales" });
    expect(prisma.candidate.create).toHaveBeenCalled();
    await expect(createCandidate({ name: "A", email: "a@b.com", role: "invalid" })).rejects.toThrow();
  });

  it("logInteraction requires summary", async () => {
    await expect(logInteraction("c1", "call", "  ")).rejects.toThrow();
  });

  it("evaluateCandidate runs transaction", async () => {
    await evaluateCandidate("c1", { communication: 7, speed: 7, clarity: 7, closing: 8 });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
