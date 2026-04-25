import { describe, expect, it } from "vitest";

import { validateDraft, checkConsistency } from "@/lib/compliance/draft-validation";
import { runInternalDraftGeneration } from "@/lib/ai/internal-draft-runner";

describe("validateDraft", () => {
  it("requires address and buyer", () => {
    const v = validateDraft({});
    expect(v.valid).toBe(false);
    expect(v.errors).toContain("ADDRESS_REQUIRED");
    expect(v.errors).toContain("BUYER_REQUIRED");
  });

  it("passes when fields present", () => {
    const v = validateDraft({ propertyAddress: "1 Main St", buyerName: "Jane" });
    expect(v.valid).toBe(true);
  });
});

describe("checkConsistency", () => {
  it("flags address mismatch", () => {
    const c = checkConsistency({
      listing: { address: "A" },
      draft: { propertyAddress: "B" },
    });
    expect(c.valid).toBe(false);
    expect(c.errors).toContain("ADDRESS_MISMATCH");
  });
});

describe("runInternalDraftGeneration", () => {
  it("records sourceUsed from chunks", () => {
    const r = runInternalDraftGeneration({
      formType: "OACIQ_PROMISE",
      facts: { propertyAddress: "10 Rue", buyerName: "Paul" },
      sources: [
        { sourceKey: "oaciq/form-x", content: "template text", confidence: 0.9 },
      ],
    });
    expect(r.sourceUsed).toContain("oaciq/form-x");
    expect(r.fields.propertyAddress).toBe("10 Rue");
  });

  it("clause mode emits clauseBody without requiring full-form fields", () => {
    const r = runInternalDraftGeneration({
      formType: "promise_to_purchase",
      facts: { inspectionDays: 14 },
      mode: "clause",
      clauseType: "inspection",
      sources: [{ sourceKey: "oaciq/clause-a", content: "Inspection clause …", confidence: 0.88 }],
    });
    expect(r.fields.clauseType).toBe("inspection");
    expect(String(r.fields.clauseBody)).toContain("oaciq/clause-a");
    expect(r.sourceUsed).toContain("oaciq/clause-a");
  });
});
