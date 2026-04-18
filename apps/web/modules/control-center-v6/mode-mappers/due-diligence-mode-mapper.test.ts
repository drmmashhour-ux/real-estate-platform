import { describe, expect, it } from "vitest";
import { minimalV4Payload } from "@/modules/control-center-v5/test-fixtures/v4-minimal";
import { mapDueDiligenceMode } from "./due-diligence-mode-mapper";

describe("mapDueDiligenceMode", () => {
  it("keeps diligence signals source-grounded", () => {
    const v4 = minimalV4Payload();
    const p = mapDueDiligenceMode(v4, null);
    expect(p.mode).toBe("due_diligence");
    expect(p.diligenceSummary).toContain("governance aggregate");
    expect(p.moatSignals.every((s) => typeof s === "string")).toBe(true);
  });
});
