import { describe, expect, it } from "vitest";
import { formatSyriaCurrency, formatSyriaDate, formatSyriaNumber } from "../format";

describe("format helpers", () => {
  it("formatSyriaCurrency uses locale hint without throwing", () => {
    const ar = formatSyriaCurrency(1200, "SYP", "ar");
    const en = formatSyriaCurrency(1200, "SYP", "en");
    expect(ar).toContain("SYP");
    expect(en).toContain("SYP");
  });

  it("formatSyriaNumber returns string for finite input (may use Arabic-Indic digits)", () => {
    const s = formatSyriaNumber(3.5, "ar");
    expect(s.length).toBeGreaterThan(0);
  });

  it("formatSyriaDate returns empty for invalid date", () => {
    expect(formatSyriaDate("invalid", "en")).toBe("");
  });
});
