import { describe, expect, it } from "vitest";
import { validateDraft } from "@/src/modules/ai-drafting/validation/draftValidationService";

describe("draftValidationService", () => {
  it("flags missing required fields", () => {
    const out = validateDraft("lease_notice_v1", {});
    expect(out.valid).toBe(false);
    expect(out.issues.some((i) => i.code === "required_missing")).toBe(true);
  });

  it("checks deterministic date ordering", () => {
    const out = validateDraft("broker_engagement_v1", {
      client_name: "x",
      broker_name: "y",
      service_scope: "z",
      fee_terms: "f",
      start_date: "2026-05-01",
      end_date: "2026-04-01",
    });
    expect(out.issues.some((i) => i.code === "date_order_invalid")).toBe(true);
  });
});
