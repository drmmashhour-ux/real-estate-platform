import { describe, expect, it } from "vitest";

import {
  buildExploreHrefWithCityPrefill,
  defaultListingDetailBaseFromListingsHref,
  getHeroHeadline,
  getHeroSubcopy,
  getPrimaryCtaEmphasis,
} from "../heroCopy";

describe("Order 40 — hero copy (smart hero)", () => {
  it("no city → default headline (anonymous / no geo)", () => {
    expect(getHeroHeadline(undefined, "unknown")).toBe("Smarter real estate starts here");
  });

  it("returns personalized behavior subcopy for returning user profiles", () => {
    expect(getHeroSubcopy("high_intent")).toContain("filling fast");
    expect(getHeroSubcopy("browser")).toContain("tailored to your preferences");
    expect(getHeroSubcopy("new").length).toBeGreaterThan(20);
  });

  it("city + demand high → high-demand headline", () => {
    expect(getHeroHeadline("Montréal", "high")).toContain("high-demand");
    expect(getHeroHeadline("Montréal", "high")).toContain("Montréal");
  });

  it("city + demand low → opportunity headline", () => {
    expect(getHeroHeadline("Montréal", "low")).toContain("great opportunities");
  });

  it("CTA emphasis: high_intent → explore; override → list", () => {
    expect(getPrimaryCtaEmphasis("high_intent")).toBe("explore");
    expect(getPrimaryCtaEmphasis("new", "list")).toBe("list");
  });

  it("search prefill: appends ?city= when missing", () => {
    expect(buildExploreHrefWithCityPrefill("/en/ca/listings", "Montreal")).toBe(
      "/en/ca/listings?city=Montreal"
    );
  });

  it("search prefill: merges with existing query", () => {
    expect(buildExploreHrefWithCityPrefill("/search?q=loft", "Montréal")).toContain("city=Montr%C3%A9al");
  });

  it("default listing detail path from listings href", () => {
    expect(defaultListingDetailBaseFromListingsHref("/en/ca/listings")).toBe("/en/ca/bnhub/listings");
    expect(defaultListingDetailBaseFromListingsHref("/en/ca/listings?foo=1")).toBe(
      "/en/ca/bnhub/listings?foo=1"
    );
  });
});
