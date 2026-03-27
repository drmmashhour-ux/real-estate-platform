import { describe, expect, it } from "vitest";
import {
  LECIPM_AI_ASSISTANT_REMINDER,
  LECIPM_SUPPORTING_WORKFLOW_CAPTION,
  LECIPM_WORKFLOW_EVALUATE_FALLBACK,
} from "@/src/modules/case-command-center/application/lecipmTrustCopy";

describe("lecipmTrustCopy", () => {
  it("exposes non-empty deterministic strings", () => {
    expect(LECIPM_WORKFLOW_EVALUATE_FALLBACK.length).toBeGreaterThan(10);
    expect(LECIPM_SUPPORTING_WORKFLOW_CAPTION.length).toBeGreaterThan(10);
    expect(LECIPM_AI_ASSISTANT_REMINDER.length).toBeGreaterThan(10);
    expect(LECIPM_WORKFLOW_EVALUATE_FALLBACK).not.toMatch(/stack|exception|500/i);
  });
});
