import { describe, expect, it } from "vitest";
import { checkText } from "./check";
import { correctText } from "./correct";

describe("checkText", () => {
  it("flags English typo and offers suggestions", () => {
    const { locale, errors } = checkText("The quik brown fox jumps.", { locale: "en" });
    expect(locale).toBe("en");
    const quik = errors.find((e) => e.word === "quik");
    expect(quik).toBeTruthy();
    expect(quik?.suggestions.length).toBeGreaterThan(0);
    expect(quik?.suggestions.some((s) => /quick/i.test(s))).toBe(true);
  });

  it("respects French locale", () => {
    const { locale, errors } = checkText("Bonjour ceci est un ordinatuer portable.", { locale: "fr" });
    expect(locale).toBe("fr");
    const bad = errors.find((e) => e.word.toLowerCase().includes("ordinat"));
    expect(bad).toBeTruthy();
    expect(bad?.suggestions.length).toBeGreaterThan(0);
  });
});

describe("correctText", () => {
  it("applies common map and suggestions", () => {
    const fixed = correctText("The teh quik brown fox.", { locale: "en" });
    expect(fixed.toLowerCase()).toContain("the");
    expect(fixed.toLowerCase()).not.toContain("quik");
    expect(fixed.toLowerCase()).toContain("quick");
  });
});
