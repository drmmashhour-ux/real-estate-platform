import { describe, expect, it } from "vitest";
import { resolveDarlinkLocale, resolveSyriaLocale } from "../locale-resolver";

describe("resolveDarlinkLocale", () => {
  it("prefers pathname locale", () => {
    expect(resolveDarlinkLocale({ pathnameLocale: "en" })).toBe("en");
  });

  it("falls back to Arabic", () => {
    expect(resolveDarlinkLocale({})).toBe("ar");
  });

  it("reads cookie when present", () => {
    expect(
      resolveDarlinkLocale({
        cookieHeader: "foo=bar; DARLINK_LOCALE=en; x=1",
      }),
    ).toBe("en");
  });

  it("reads lang query param", () => {
    expect(resolveDarlinkLocale({ searchParams: { lang: "en" } })).toBe("en");
    expect(resolveSyriaLocale({ searchParams: { lang: "en" } })).toBe("en");
  });
});
