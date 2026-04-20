import { describe, expect, it } from "vitest";
import {
  buildGrowthOpportunities,
  prioritizeGrowthOpportunities,
  summarizeGrowthSignals,
} from "../growth-opportunity.service";
import { emptyGrowthSnapshot } from "./snapshot-fixtures";

describe("growth-opportunity.service", () => {
  it("summarizes and builds opportunities deterministically from signals", () => {
    const snapshot = emptyGrowthSnapshot();
    const signals = [
      {
        id: "sig_seo_1",
        signalType: "seo_gap" as const,
        severity: "warning" as const,
        entityType: "region",
        entityId: null,
        region: "MTL",
        locale: "en",
        country: "ca",
        title: "Gap",
        explanation: "test explanation",
        observedAt: snapshot.collectedAt,
        metadata: {},
      },
    ];
    const sum = summarizeGrowthSignals({ snapshot, signals });
    expect(sum.countsByType.seo_gap).toBe(1);
    const opps = buildGrowthOpportunities({ snapshot, signals: sum.signals });
    expect(opps).toHaveLength(1);
    expect(opps[0]?.opportunityType).toBe("recommend_seo_refresh");
    const prioritized = prioritizeGrowthOpportunities(opps);
    expect(prioritized).toHaveLength(1);
  });

  it("returns safe empty structures when no signals", () => {
    const snapshot = emptyGrowthSnapshot();
    expect(() =>
      summarizeGrowthSignals({ snapshot, signals: [] })
    ).not.toThrow();
    const sum = summarizeGrowthSignals({ snapshot, signals: [] });
    expect(sum.signals).toHaveLength(0);
    expect(buildGrowthOpportunities({ snapshot, signals: [] })).toHaveLength(0);
  });
});
