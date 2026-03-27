import { describe, expect, it } from "vitest";
import { buildLegalAssistantResponse } from "@/src/modules/ai-legal-assistant/infrastructure/legalAssistantResponseBuilder";

const ctx = {
  documentId: "d1",
  status: "in_review",
  payload: { known_defects_details: "x" },
  validation: {
    completenessPercent: 76,
    missingFields: ["lease_details"],
    contradictionFlags: ["conflict A"],
    warningFlags: ["warn A"],
    sectionStatuses: [{ sectionKey: "known_defects", ready: true, missing: [] }],
  },
  audit: [],
  signatures: [{ id: "s1", signerName: "A", signerEmail: "a@x.com", status: "pending", signedAt: null }],
  versions: [{ id: "v1", versionNumber: 1, createdAt: new Date().toISOString() }],
  knowledge: ["k1"],
} as any;

describe("legalAssistantResponseBuilder", () => {
  it("builds grounded missing-items summary", () => {
    const out = buildLegalAssistantResponse("identify_missing_items" as any, ctx);
    expect(out.summary).toContain("missing");
    expect(out.keyPoints).toContain("lease_details");
  });

  it("builds risk explanation from context only", () => {
    const out = buildLegalAssistantResponse("explain_risk" as any, ctx);
    expect(out.keyPoints.join(" ")).toContain("conflict A");
    expect(out.summary.toLowerCase()).not.toContain("guaranteed");
  });
});
