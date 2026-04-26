import { describe, expect, it } from "vitest";
import {
  normalizeLocale,
  localeDirection,
  fallbackLocaleChain,
  getLocalizedValue,
  resolveSyriaLocale,
  isRtlLocale,
  getLocaleDirection,
} from "../helpers";

describe("i18n helpers", () => {
  it("normalizes unknown locale to Arabic", () => {
    expect(normalizeLocale(undefined)).toBe("ar");
    expect(normalizeLocale("fr")).toBe("ar");
  });

  it("preserves ar and en", () => {
    expect(normalizeLocale("ar")).toBe("ar");
    expect(normalizeLocale("en")).toBe("en");
  });

  it("resolveSyriaLocale matches normalizeLocale", () => {
    expect(resolveSyriaLocale("EN")).toBe("en");
    expect(resolveSyriaLocale("ar-SY")).toBe("ar");
  });

  it("isRtlLocale and getLocaleDirection", () => {
    expect(isRtlLocale("ar")).toBe(true);
    expect(isRtlLocale("en")).toBe(false);
    expect(getLocaleDirection("ar")).toBe("rtl");
    expect(getLocaleDirection("en")).toBe("ltr");
  });

  it("maps direction", () => {
    expect(localeDirection("ar")).toBe("rtl");
    expect(localeDirection("en")).toBe("ltr");
  });

  it("fallback chain starts with normalized locale", () => {
    expect(fallbackLocaleChain("en")).toEqual(["en", "ar"]);
    expect(fallbackLocaleChain("xx")[0]).toBe("ar");
  });

  it("getLocalizedValue EN falls back to AR", () => {
    expect(getLocalizedValue({ ar: "مرحبا", en: null }, "en")).toBe("مرحبا");
    expect(getLocalizedValue({ ar: "أ", en: "B" }, "en")).toBe("B");
    expect(getLocalizedValue({ ar: "أ", en: "B" }, "ar")).toBe("أ");
  });
});
