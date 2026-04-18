import { describe, expect, it } from "vitest";
import { explainSyriaSignals } from "../syria-signal-explainability.service";
import type { SyriaSignal } from "../syria-signal.types";

describe("explainSyriaSignals", () => {
  it("returns ordered lines without duplication", () => {
    const signals: SyriaSignal[] = [
      {
        type: "inactive_listing",
        severity: "info",
        message: "x",
        contributingMetrics: {},
      },
      {
        type: "potential_fraud_pattern",
        severity: "critical",
        message: "y",
        contributingMetrics: {},
      },
    ];
    const lines = explainSyriaSignals(signals);
    expect(lines[0]).toContain("potential risk");
    expect(lines.length).toBe(2);
  });

  it("returns empty for no signals", () => {
    expect(explainSyriaSignals([])).toEqual([]);
  });
});
