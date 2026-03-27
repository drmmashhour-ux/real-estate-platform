import { describe, expect, it, vi } from "vitest";
import { suggestFieldText, improveWording } from "@/src/modules/ai-drafting/assistant/draftingAssistant";

vi.mock("@/src/modules/knowledge/retrieval/legalContextRetrievalService", () => ({
  getLegalContext: vi.fn().mockResolvedValue([
    {
      chunkId: "c1",
      content: "Clauses must be explicit and referenced to the contract.",
      score: 0.9,
      chunkType: "clause",
      audience: "transaction",
      importance: "mandatory",
      pageNumber: 2,
      source: {
        documentId: "d1",
        title: "Drafting guide",
        documentType: "drafting",
        fileUrl: "https://example.com/guide.pdf",
      },
    },
  ]),
}));

describe("draftingAssistant", () => {
  it("returns constrained template-field suggestions grounded in retrieval", async () => {
    const out = await suggestFieldText({
      templateId: "lease_notice_v1",
      fieldKey: "clause_reference",
      context: { tenant_name: "John" },
    });
    expect(out.suggestion.toLowerCase()).toContain("clause");
    expect(out.reasons.length).toBeGreaterThan(0);
    expect(out.reasons[0]).toContain("Drafting guide");
  });

  it("improves wording without uncontrolled generation", () => {
    const out = improveWording("  this clause applies   to rent ");
    expect(out.improved).toContain("reviewed for clarity");
  });
});
