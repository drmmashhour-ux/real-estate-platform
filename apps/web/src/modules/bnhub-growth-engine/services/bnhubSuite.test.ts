import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { evaluateVerifiedEligibility, evaluatePremiumEligibility, evaluateEliteEligibility } from "./luxuryTierService";
import { applyGuardrails, applyQualityAdjustments } from "./dynamicPricingService";

describe("luxury tier eligibility", () => {
  it("verified requires 3★ and basics", () => {
    const ok = evaluateVerifiedEligibility({
      starRating: 4,
      trustScore: 60,
      photoCount: 10,
      verificationOk: true,
      openCriticalFraud: false,
    });
    expect(ok.ok).toBe(true);
    const bad = evaluateVerifiedEligibility({
      starRating: 2,
      trustScore: 60,
      photoCount: 5,
      verificationOk: true,
      openCriticalFraud: false,
    });
    expect(bad.ok).toBe(false);
  });

  it("elite requires strong stack", () => {
    const ok = evaluateEliteEligibility({
      starRating: 5,
      overallScore: 90,
      trustScore: 80,
      luxurySignalsStrong: true,
      openUnresolvedRisk: false,
    });
    expect(ok.ok).toBe(true);
  });
});

describe("applyQualityAdjustments", () => {
  it("clamps wild star and classification inputs", () => {
    const a = Number(applyQualityAdjustments(-10, 999));
    const b = Number(applyQualityAdjustments(3, 60));
    expect(a).toBeGreaterThan(0.9);
    expect(a).toBeLessThan(1.1);
    expect(Number.isFinite(b)).toBe(true);
  });
});

describe("applyGuardrails", () => {
  it("clamps to min/max", () => {
    const lo = new Prisma.Decimal(50);
    const hi = new Prisma.Decimal(150);
    expect(Number(applyGuardrails(new Prisma.Decimal(10), lo, hi))).toBe(50);
    expect(Number(applyGuardrails(new Prisma.Decimal(200), lo, hi))).toBe(150);
    expect(Number(applyGuardrails(new Prisma.Decimal(100), lo, hi))).toBe(100);
  });
});

describe("evaluatePremiumEligibility", () => {
  it("blocks medium fraud", () => {
    const r = evaluatePremiumEligibility({
      starRating: 4,
      trustScore: 70,
      visualScore: 70,
      openMediumPlusFraud: true,
    });
    expect(r.ok).toBe(false);
  });
});
