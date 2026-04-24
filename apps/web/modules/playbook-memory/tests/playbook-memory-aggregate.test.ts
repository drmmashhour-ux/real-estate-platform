import { describe, expect, it } from "vitest";
import {
  buildLearnAggregateFromRecords,
  countFailedExecutions,
  countSuccessfulExecutions,
  countTotalExecutions,
} from "../utils/playbook-memory-aggregate";
import type { PlaybookMemoryRecordForAggregate } from "../utils/playbook-memory-aggregate";

function row(
  o: MemoryOutcome,
  v?: { ev?: number; rv?: number; rr?: number; c?: number; r?: number },
): PlaybookMemoryRecordForAggregate {
  return {
    outcomeStatus: o,
    expectedValue: v?.ev ?? null,
    realizedValue: v?.rv ?? null,
    realizedRevenue: v?.rr ?? null,
    realizedConversion: v?.c ?? null,
    realizedRiskScore: v?.r ?? null,
    createdAt: new Date(),
  };
}

type MemoryOutcome = "SUCCEEDED" | "FAILED" | "PENDING" | "NEUTRAL" | "CANCELLED" | "PARTIAL";

describe("playbook-memory-aggregate", () => {
  it("counts success and failure per Wave 5 rules", () => {
    const r = [row("SUCCEEDED"), row("SUCCEEDED"), row("FAILED"), row("PENDING")];
    expect(countTotalExecutions(r)).toBe(4);
    expect(countSuccessfulExecutions(r)).toBe(2);
    expect(countFailedExecutions(r)).toBe(1);
  });

  it("returns null averages when no numeric data", () => {
    const agg = buildLearnAggregateFromRecords([row("PENDING")]);
    expect(agg.avgExpectedValue).toBeNull();
    expect(agg.avgRealizedValue).toBeNull();
  });

  it("averages only defined metrics", () => {
    const agg = buildLearnAggregateFromRecords([
      row("SUCCEEDED", { ev: 1, rv: 2, c: 0.5 }),
      row("SUCCEEDED", { ev: 3, c: 0.5, r: 10 }),
    ]);
    expect(agg.avgExpectedValue).toBe(2);
    expect(agg.avgConversionLift).toBe(0.5);
    expect(agg.avgRealizedRevenue).toBeNull();
  });
});
