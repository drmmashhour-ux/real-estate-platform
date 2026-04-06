import { describe, expect, it } from "vitest";
import { parseVoiceQuery, voiceParseHasSignal } from "@/lib/search/parseVoiceQuery";

describe("parseVoiceQuery", () => {
  it("parses example condo query", () => {
    const p = parseVoiceQuery("2 bedroom condo in Montreal under 600k");
    expect(p.beds).toBe(2);
    expect(p.city).toBe("Montreal");
    expect(p.maxPrice).toBe(600_000);
    expect(p.propertyTypes).toContain("CONDO");
    expect(voiceParseHasSignal(p)).toBe(true);
  });

  it("returns no signal for empty", () => {
    const p = parseVoiceQuery("   ");
    expect(voiceParseHasSignal(p)).toBe(false);
  });
});
