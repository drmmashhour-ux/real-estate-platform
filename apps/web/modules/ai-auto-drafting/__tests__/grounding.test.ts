import { describe, expect, it, vi } from "vitest";
import { buildSectionSuggestion } from "@/src/modules/ai-auto-drafting/infrastructure/autoDraftingSuggestionService";

vi.mock("@/src/modules/ai-auto-drafting/infrastructure/autoDraftingRetrievalService", () => ({
  retrieveLawContextForSection: vi.fn().mockResolvedValue([]),
  chunksToSourceRefs: vi.fn().mockReturnValue([]),
}));

describe("auto-drafting grounding", () => {
  it("does not invent facts — only echoes provided facts", async () => {
    const out = await buildSectionSuggestion({
      templateId: "seller_declaration_v1",
      sectionKey: "ownership_occupancy",
      documentType: "seller_declaration",
      facts: { owner_occupied: true, occupancy_notes: "Lived here since 2019; neutral factual note." },
    });
    expect(out.suggestedText).toContain("Lived here since 2019");
    expect(out.suggestedText).toContain("Owner occupied: [provided — verify manually]");
    expect(out.assumptions.some((a) => a.toLowerCase().includes("no new factual"))).toBe(true);
  });
});
