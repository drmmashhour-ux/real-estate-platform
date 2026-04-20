import { describe, expect, it } from "vitest";
import { prioritizeGrowthOpportunities, scoreGrowthOpportunity } from "../growth-priority.service";
import { buildGrowthOpportunities } from "../growth-opportunity.service";
import { summarizeGrowthSignals } from "../growth-opportunity.service";
import type { GrowthSignal } from "../growth.types";
import { emptyGrowthSnapshot } from "./snapshot-fixtures";

function signal(t: GrowthSignal["signalType"]): GrowthSignal {
  return {
    id: `sig_${t}`,
    signalType: t,
    severity: "warning",
    entityType: "region",
    entityId: null,
    region: "X",
    locale: "en",
    country: "ca",
    title: "t",
    explanation: "e",
    observedAt: "2026-04-01T12:00:00.000Z",
    metadata: {},
  };
}

describe("growth-priority.service", () => {
  it("prioritization is deterministic for same inputs", () => {
    const snapshot = emptyGrowthSnapshot();
    const raw = [signal("seo_gap"), signal("low_conversion_page")];
    const sum = summarizeGrowthSignals({ snapshot, signals: raw });
    const opps = buildGrowthOpportunities({ snapshot, signals: sum.signals });
    const a = prioritizeGrowthOpportunities(opps).map((o) => o.id).join("|");
    const b = prioritizeGrowthOpportunities(opps).map((o) => o.id).join("|");
    expect(a).toBe(b);
  });

  it("scoreGrowthOpportunity returns reasons array", () => {
    const snapshot = emptyGrowthSnapshot();
    const sum = summarizeGrowthSignals({ snapshot, signals: [signal("trust_conversion_opportunity")] });
    const opps = buildGrowthOpportunities({ snapshot, signals: sum.signals });
    const sc = scoreGrowthOpportunity(opps[0]!);
    expect(sc.reasons.length).toBeGreaterThan(0);
    expect(sc.totalScore).toBeGreaterThanOrEqual(0);
    expect(sc.totalScore).toBeLessThanOrEqual(100);
  });
});
