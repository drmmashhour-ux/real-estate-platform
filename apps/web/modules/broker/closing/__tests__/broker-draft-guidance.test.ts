import { describe, expect, it } from "vitest";
import { plainLanguageDraftGuidance } from "@/modules/broker/closing/broker-draft-guidance";

describe("plainLanguageDraftGuidance", () => {
  it("returns non-empty copy for each known hint", () => {
    for (const h of ["first_contact", "follow_up", "meeting_push", "revive_lead"] as const) {
      const t = plainLanguageDraftGuidance(h);
      expect(t.length).toBeGreaterThan(20);
    }
  });

  it("returns a safe default for null", () => {
    const t = plainLanguageDraftGuidance(null);
    expect(t).toMatch(/manually/i);
  });
});
