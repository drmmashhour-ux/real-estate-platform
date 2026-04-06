import { describe, expect, it } from "vitest";
import { validateLocaleKeyParity } from "../validate-locale-parity";
import { UI_LOCALES } from "../types";
import { getDirection } from "../direction";

describe("i18n foundations", () => {
  it("getDirection: Arabic RTL, others LTR", () => {
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("fr")).toBe("ltr");
  });

  it("UI_LOCALES is stable", () => {
    expect(UI_LOCALES).toEqual(["en", "fr", "ar"]);
  });

  it("locale key parity: fr/ar mirror en structure", () => {
    const r = validateLocaleKeyParity();
    expect(r.enKeyCount).toBeGreaterThan(50);
    expect(r.frMissing).toEqual([]);
    expect(r.arMissing).toEqual([]);
  });
});
