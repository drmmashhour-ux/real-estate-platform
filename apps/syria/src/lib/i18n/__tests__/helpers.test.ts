import { describe, expect, it } from "vitest";
import { normalizeLocale, localeDirection, fallbackLocaleChain } from "../helpers";

describe("i18n helpers", () => {
  it("normalizes unknown locale to Arabic", () => {
    expect(normalizeLocale(undefined)).toBe("ar");
    expect(normalizeLocale("fr")).toBe("ar");
  });

  it("preserves ar and en", () => {
    expect(normalizeLocale("ar")).toBe("ar");
    expect(normalizeLocale("en")).toBe("en");
  });

  it("maps direction", () => {
    expect(localeDirection("ar")).toBe("rtl");
    expect(localeDirection("en")).toBe("ltr");
  });

  it("fallback chain starts with normalized locale", () => {
    expect(fallbackLocaleChain("en")).toEqual(["en", "ar"]);
    expect(fallbackLocaleChain("xx")[0]).toBe("ar");
  });
});
