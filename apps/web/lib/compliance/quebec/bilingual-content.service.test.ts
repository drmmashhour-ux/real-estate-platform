import { describe, expect, it } from "vitest";
import { generateBilingualContent } from "@/lib/compliance/quebec/bilingual-content.service";

describe("generateBilingualContent", () => {
  it("produces French companion for English input (glossary or LLM)", async () => {
    const bi = await generateBilingualContent("Review the offer before closing.", "EN");
    expect(bi.originalLang).toBe("EN");
    expect(bi.englishText.length).toBeGreaterThan(0);
    expect(bi.frenchText.length).toBeGreaterThan(0);
    expect(bi.frenchText.toLowerCase()).toContain("promesse");
  });
});
