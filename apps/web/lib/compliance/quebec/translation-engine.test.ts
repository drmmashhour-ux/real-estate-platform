import { describe, expect, it } from "vitest";
import {
  applyQuebecRealEstateGlossaryEnToFr,
  detectMessageLanguage,
} from "@/lib/compliance/quebec/translation-engine";

describe("translation-engine", () => {
  it("maps offer to promesse d'achat", () => {
    expect(applyQuebecRealEstateGlossaryEnToFr("Please sign the offer.")).toContain("promesse d'achat");
  });

  it("detects English vs French", () => {
    expect(detectMessageLanguage("Hi, I would like to schedule a visit.")).toBe("EN");
    expect(detectMessageLanguage("Bonjour, j'aimerais planifier une visite.")).toBe("FR");
  });
});
