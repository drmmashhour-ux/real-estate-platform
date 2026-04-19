import { describe, expect, it } from "vitest";
import {
  aggregateLanding,
  aggregateOutcomeBuckets,
  aggregatePlaybook,
  aggregateSourcing,
  computeSparseSummary,
} from "@/modules/growth/fast-deal-results-aggregate";
import { generateFastDealInsights } from "@/modules/growth/fast-deal-insights.service";

describe("fast-deal aggregate (deterministic)", () => {
  it("aggregates sourcing by platform and subTypes", () => {
    const rows = [
      {
        sourceType: "broker_sourcing",
        sourceSubType: "query_copied",
        metadataJson: { platform: "facebook", city: "Mtl" },
      },
      {
        sourceType: "broker_sourcing",
        sourceSubType: "query_copied",
        metadataJson: { platform: "facebook", city: "Mtl" },
      },
      {
        sourceType: "broker_sourcing",
        sourceSubType: "session_started",
        metadataJson: { platform: "instagram", city: "Mtl" },
      },
    ];
    const agg = aggregateSourcing(rows);
    expect(agg.find((r) => r.platform === "facebook")).toMatchObject({
      queryCopies: 2,
      sessionsStarted: 0,
      events: 2,
    });
    expect(agg.find((r) => r.platform === "instagram")).toMatchObject({
      sessionsStarted: 1,
      events: 1,
    });
  });

  it("aggregates landing by marketVariant", () => {
    const rows = [
      {
        sourceType: "landing_capture",
        sourceSubType: "landing_preview_shown",
        metadataJson: { marketVariant: "Québec City" },
      },
      {
        sourceType: "landing_capture",
        sourceSubType: "lead_submitted",
        metadataJson: { marketVariant: "Québec City" },
      },
    ];
    expect(aggregateLanding(rows)).toEqual([
      expect.objectContaining({
        marketVariant: "Québec City",
        previewShown: 1,
        submitted: 1,
      }),
    ]);
  });

  it("marks sparse data thresholds", () => {
    expect(computeSparseSummary(3, 2).level).toBe("very_low");
    expect(computeSparseSummary(20, 8).level).toBe("low");
    expect(computeSparseSummary(80, 20).level).toBe("ok");
  });

  it("counts playbook acknowledgements vs completions", () => {
    const rows = [
      {
        sourceType: "closing_playbook",
        sourceSubType: "step_acknowledged",
        metadataJson: { step: 2 },
      },
      {
        sourceType: "closing_playbook",
        sourceSubType: "step_completed",
        metadataJson: { step: 2 },
      },
      {
        sourceType: "closing_playbook",
        sourceSubType: "step_acknowledged",
        metadataJson: { step: 2 },
      },
    ];
    const p = aggregatePlaybook(rows);
    const step2 = p.find((x) => x.step === 2);
    expect(step2?.possiblySkippedHints).toBeGreaterThanOrEqual(0);
    expect(step2?.acknowledged).toBe(2);
    expect(step2?.completed).toBe(1);
  });

  it("buckets outcomes", () => {
    expect(
      aggregateOutcomeBuckets([{ outcomeType: "lead_captured" }, { outcomeType: "lead_captured" }]),
    ).toEqual([{ outcomeType: "lead_captured", count: 2 }]);
  });
});

describe("generateFastDealInsights", () => {
  it("avoids market comparison when sparse", () => {
    const sparse = computeSparseSummary(5, 2);
    const insights = generateFastDealInsights({
      sourcing: [],
      landing: [
        { marketVariant: "A", previewShown: 1, formStarted: 0, submitted: 0 },
        { marketVariant: "B", previewShown: 1, formStarted: 0, submitted: 0 },
      ],
      playbook: [],
      outcomeTotals: { leadCaptured: 0, progressed: 0, closed: 0 },
      sparse,
    });
    expect(insights.some((l) => l.includes("Insufficient") || l.includes("illustrative"))).toBe(true);
  });
});
