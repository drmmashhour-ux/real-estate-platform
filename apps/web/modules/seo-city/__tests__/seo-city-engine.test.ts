import { describe, expect, it } from "vitest";

import { buildSeoMetadataBundle } from "../seo-city-metadata.service";
import { contentFingerprint, buildCityIntroBlocks, buildBrokerBlocks } from "../seo-city-content.service";
import { citySeoSegmentPath, neighborhoodPath, withLocaleCountryPath } from "../seo-city-routing.service";

describe("seo-city-metadata.service", () => {
  it("builds city metadata with title and canonical", () => {
    const m = buildSeoMetadataBundle({
      kind: "CITY",
      citySlug: "montreal",
      canonicalPath: "/en/ca/city/montreal",
      introSnippet: "Montreal is a great market for testing SEO copy length limits and truncation behavior.",
    });
    expect(m.title).toContain("Montreal");
    expect(m.description.length).toBeLessThanOrEqual(180);
    expect(m.openGraph?.title).toBe(m.title);
    expect(m.alternates?.canonical).toBe("/en/ca/city/montreal");
    expect(m.keywords.length).toBeGreaterThan(2);
  });

  it("builds broker page metadata", () => {
    const m = buildSeoMetadataBundle({
      kind: "BROKER",
      citySlug: "laval",
      canonicalPath: "/fr/ca/city/laval/brokers",
    });
    expect(m.title).toMatch(/brokers|Laval/i);
    expect(m.description).toBeTruthy();
  });
});

describe("seo-city-content.service", () => {
  it("contentFingerprint is stable", () => {
    const a = contentFingerprint("quebec", "CITY");
    const b = contentFingerprint("quebec", "CITY");
    expect(a).toBe(b);
    expect(a).not.toBe(contentFingerprint("montreal", "CITY"));
  });

  it("buildCityIntroBlocks includes blocks with unique ids", () => {
    const blocks = buildCityIntroBlocks("montreal", {
      citySlug: "montreal",
      fsboCount: 3,
      bnhubCount: 2,
      avgPriceCentsFsbo: 500_000_00,
      avgNightCentsBnhub: 12_000,
      generatedAtIso: new Date().toISOString(),
    });
    const ids = blocks.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(blocks[0]?.body.length).toBeGreaterThan(20);
  });

  it("buildBrokerBlocks is non-empty", () => {
    const blocks = buildBrokerBlocks("laval");
    expect(blocks.length).toBeGreaterThan(0);
  });
});

describe("seo-city-routing.service", () => {
  it("builds expected paths", () => {
    expect(citySeoSegmentPath("montreal", "brokers")).toBe("/city/montreal/brokers");
    expect(citySeoSegmentPath("montreal", "n/test-area")).toBe("/city/montreal/n/test-area");
    expect(neighborhoodPath("montreal", "griffintown")).toBe("/city/montreal/n/griffintown");
    expect(withLocaleCountryPath("en", "ca", "/city/montreal")).toBe("/en/ca/city/montreal");
  });
});
