import { describe, expect, it } from "vitest";
import { assertNoGuaranteeLanguageInPayload, buildDefaultDocumentChecklistJson } from "../amf-private-placement.constants";

describe("amf-private-placement.constants", () => {
  it("builds checklist with required docs", () => {
    const c = buildDefaultDocumentChecklistJson();
    expect(c.subscription_agreement?.required).toBe(true);
    expect(c.classification_audit_trail?.label).toMatch(/classification/i);
  });

  it("rejects guarantee-of-return style language", () => {
    expect(() => assertNoGuaranteeLanguageInPayload({ note: "guaranteed return for investors" })).toThrow(
      /FORBIDDEN_GUARANTEE_LANGUAGE/,
    );
  });
});
