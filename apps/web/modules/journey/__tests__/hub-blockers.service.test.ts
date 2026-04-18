import { describe, expect, it } from "vitest";
import { detectHubBlockers } from "../hub-blockers.service";

describe("detectHubBlockers", () => {
  it("returns buyer contact blocker when shortlist without contact", () => {
    const b = detectHubBlockers("buyer", {
      locale: "en",
      country: "ca",
      buyerShortlistCount: 2,
      buyerContactedSeller: false,
    });
    expect(b.some((x) => x.includes("saved listings"))).toBe(true);
  });

  it("returns empty for admin by default", () => {
    expect(detectHubBlockers("admin", { locale: "en", country: "ca" })).toEqual([]);
  });
});
