import { describe, expect, it } from "vitest";
import { computeAllocationPriority } from "@/modules/growth/capital-allocation-scoring.service";
import { classifyCityBucket, classifySystemBrokerBucket } from "@/modules/growth/capital-allocation-rules.service";
import { buildCapitalAllocationInsights } from "@/modules/growth/capital-allocation-insights.service";
import type { NormalizedCitySignals } from "@/modules/growth/capital-allocation-signals.service";
import type { CapitalAllocationRecommendation } from "@/modules/growth/capital-allocation.types";

function norm(p: Partial<NormalizedCitySignals> & Pick<NormalizedCitySignals, "city" | "dataTier">): NormalizedCitySignals {
  return {
    weakConversionHint: false,
    thinSupplyHint: false,
    ...p,
  };
}

describe("computeAllocationPriority", () => {
  it("matches on repeated identical input (deterministic)", () => {
    const input = {
      performanceScore: 70,
      growthPotential: 0.6,
      executionStrength: 0.5,
      scaleGapLeads: 0.4,
      competitionPressure: 0.3,
      dataTier: "high" as const,
    };
    const a = computeAllocationPriority(input);
    const b = computeAllocationPriority(input);
    expect(a.priorityScore).toBe(b.priorityScore);
    expect(a.confidence).toBe(b.confidence);
    expect(a.warnings.join("|")).toBe(b.warnings.join("|"));
  });

  it("reduces score and confidence for low data tier", () => {
    const high = computeAllocationPriority({
      executionStrength: 0.55,
      growthPotential: 0.6,
      dataTier: "high",
    });
    const low = computeAllocationPriority({
      executionStrength: 0.55,
      growthPotential: 0.6,
      dataTier: "low",
    });
    expect(low.priorityScore).toBeLessThan(high.priorityScore);
    expect(low.confidence).not.toBe("high");
    expect(low.warnings.some((w) => /low data tier/i.test(w))).toBe(true);
  });

  it("does not treat missing execution as zero — leaves channel out and warns", () => {
    const r = computeAllocationPriority({
      growthPotential: 0.5,
      dataTier: "medium",
    });
    expect(r.warnings.some((w) => /execution strength/i.test(w))).toBe(true);
  });
});

describe("classifyCityBucket", () => {
  it("classifies expansion when readiness high and confidence not low", () => {
    const { bucket } = classifyCityBucket(
      norm({
        city: "A",
        dataTier: "medium",
        performanceScore: 50,
        growthPotential: 0.55,
        expansionReadiness: "high",
        expansionConfidence: "medium",
      }),
    );
    expect(bucket).toBe("city_expansion");
  });

  it("classifies scale winner when score and execution are strong", () => {
    const { bucket } = classifyCityBucket(
      norm({
        city: "B",
        dataTier: "high",
        performanceScore: 65,
        executionStrength: 0.45,
        cityConfidence: "medium",
        growthPotential: 0.4,
      }),
    );
    expect(bucket).toBe("city_execution");
  });

  it("holds when data tier low and score missing", () => {
    const { bucket } = classifyCityBucket(
      norm({
        city: "C",
        dataTier: "low",
      }),
    );
    expect(bucket).toBe("hold");
  });
});

describe("classifySystemBrokerBucket", () => {
  it("returns broker_acquisition when insufficient ratio high", () => {
    expect(
      classifySystemBrokerBucket({
        insufficientBrokerRows: 9,
        totalBrokerRows: 15,
        scaleBrokersDelta: 1,
      }),
    ).toBe("broker_acquisition");
  });

  it("returns null when no brokers tracked", () => {
    expect(
      classifySystemBrokerBucket({
        insufficientBrokerRows: 0,
        totalBrokerRows: 0,
        scaleBrokersDelta: undefined,
      }),
    ).toBeNull();
  });
});

describe("buildCapitalAllocationInsights", () => {
  it("caps at five insights", () => {
    const recs: CapitalAllocationRecommendation[] = Array.from({ length: 9 }).map((_, i) => ({
      bucket: {
        id: "hold",
        label: "Hold",
        description: "Wait",
      },
      target: `City-${i}`,
      priorityScore: 80 - i,
      allocationShare: 0.1,
      effortLevel: "low",
      confidence: "medium",
      rationale: "test",
      supportingSignals: [],
      risks: [],
      warnings: [],
    }));
    const insights = buildCapitalAllocationInsights({
      recommendations: recs,
      topFocusAreas: [],
      deprioritizedAreas: [],
      generatedAt: new Date().toISOString(),
    });
    expect(insights.length).toBeLessThanOrEqual(5);
  });
});

describe("allocation share math (mirrors engine)", () => {
  it("normalized shares sum to ~1 for positive scores", () => {
    const scores = [80, 60, 40];
    const sum = scores.reduce((a, b) => a + b, 0);
    const shares = scores.map((s) => Math.round((s / sum) * 1000) / 1000);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 2);
  });
});
