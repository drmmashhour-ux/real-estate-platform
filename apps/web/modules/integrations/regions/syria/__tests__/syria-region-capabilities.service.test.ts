import { describe, expect, it } from "vitest";
import {
  canSyriaUseAutonomy,
  canSyriaUseControlledExecution,
  canSyriaUsePreview,
  canSyriaUseQuebecCompliance,
  canSyriaUseTrustOverlay,
  getSyriaCapabilityNotes,
} from "../syria-region-capabilities.service";

describe("syria-region-capabilities.service", () => {
  it("preview on, execution and compliance off, trust limited", () => {
    expect(canSyriaUsePreview()).toBe(true);
    expect(canSyriaUseAutonomy()).toBe(false);
    expect(canSyriaUseControlledExecution()).toBe(false);
    expect(canSyriaUseQuebecCompliance()).toBe(false);
    expect(canSyriaUseTrustOverlay()).toBe("limited_summary");
    const notes = getSyriaCapabilityNotes();
    expect(notes.some((n) => n.includes("execution_unavailable_for_syria_region"))).toBe(true);
    expect(notes.some((n) => n.includes("preview"))).toBe(true);
  });
});
