import { describe, it, expect } from "vitest";
import { shouldAutoExecuteOnIngest, normalizeAutonomyMode } from "@/src/modules/ai-operator/policies/autonomy";

describe("autonomy", () => {
  it("normalizes modes", () => {
    expect(normalizeAutonomyMode("MANUAL")).toBe("manual");
    expect(normalizeAutonomyMode("assisted")).toBe("assisted");
    expect(normalizeAutonomyMode("auto")).toBe("auto_restricted");
  });

  it("only auto-executes run_simulation in auto_restricted with high confidence", () => {
    expect(shouldAutoExecuteOnIngest("manual", "run_simulation", 0.9)).toBe(false);
    expect(shouldAutoExecuteOnIngest("assisted", "run_simulation", 0.9)).toBe(false);
    expect(shouldAutoExecuteOnIngest("auto_restricted", "run_simulation", 0.9)).toBe(true);
    expect(shouldAutoExecuteOnIngest("auto_restricted", "run_simulation", 0.5)).toBe(false);
    expect(shouldAutoExecuteOnIngest("auto_restricted", "send_message", 0.99)).toBe(false);
  });
});
