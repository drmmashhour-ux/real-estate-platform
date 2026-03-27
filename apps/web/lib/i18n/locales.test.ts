import { describe, it, expect } from "vitest";
import { parseLocaleCookie, LOCALE_COOKIE } from "./locales";

describe("parseLocaleCookie", () => {
  it("defaults to en", () => {
    expect(parseLocaleCookie(null)).toBe("en");
    expect(parseLocaleCookie("")).toBe("en");
  });

  it("reads mi_locale", () => {
    expect(parseLocaleCookie(`${LOCALE_COOKIE}=fr`)).toBe("fr");
    expect(parseLocaleCookie(`other=1; ${LOCALE_COOKIE}=ar; x=y`)).toBe("ar");
  });

  it("falls back for unknown codes", () => {
    expect(parseLocaleCookie(`${LOCALE_COOKIE}=zz`)).toBe("en");
  });
});
