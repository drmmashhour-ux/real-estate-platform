import { describe, expect, it } from "vitest";
import { generateSectionSuggestionInputSafe, generateFollowUpQuestionsSafe } from "@/src/modules/seller-declaration-ai/infrastructure/declarationAISuggestionService";

describe("declaration suggestion", () => {
  it("handles missing facts safely", () => {
    const out = generateSectionSuggestionInputSafe({ sectionKey: "water_damage", currentFacts: {} });
    expect(out.missingFacts.length).toBeGreaterThan(0);
    expect(out.assumptions[0]).toContain("provided draft facts");
  });

  it("does not insert unsupported legal facts", () => {
    const out = generateSectionSuggestionInputSafe({ sectionKey: "known_defects", currentFacts: { known_defects_details: "minor crack" } });
    expect(out.suggestedText.toLowerCase()).toContain("provided facts");
    expect(out.suggestedText.toLowerCase()).not.toContain("guaranteed");
  });

  it("generates follow-up when answer lacks details", () => {
    const out = generateFollowUpQuestionsSafe({ sectionKey: "water_damage", currentAnswer: "yes", currentDraft: {} });
    expect(out.questions.length).toBeGreaterThan(0);
  });
});
