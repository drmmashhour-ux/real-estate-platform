import { describe, expect, it } from "vitest";
import {
  buildRegionListingKey,
  isSameRegionListingKey,
  parseRegionListingKey,
  stringifyRegionListingKey,
} from "../region-listing-key.service";

describe("region-listing-key.service", () => {
  it("stringify and parse round-trip for web and syria examples", () => {
    const web = buildRegionListingKey({
      regionCode: "ca_qc",
      source: "web",
      listingId: "clabc123",
    });
    expect(web).not.toBeNull();
    const ws = stringifyRegionListingKey(web!);
    expect(ws).toBe("ca_qc:web:clabc123");
    const pw = parseRegionListingKey(ws);
    expect(pw.key).toEqual(web);
    expect(pw.fallbackNote).toBeNull();

    const sy = buildRegionListingKey({
      regionCode: "sy",
      source: "syria",
      listingId: "clxyz789",
    });
    expect(sy).not.toBeNull();
    const ss = stringifyRegionListingKey(sy!);
    expect(ss).toBe("sy:syria:clxyz789");
    expect(parseRegionListingKey(ss).key).toEqual(sy);
  });

  it("parse fails safely on malformed input", () => {
    const p = parseRegionListingKey("not-a-key");
    expect(p.key).toBeNull();
    expect(p.fallbackNote).toBeTruthy();
  });

  it("isSameRegionListingKey compares tuple fields", () => {
    const a = buildRegionListingKey({ regionCode: "sy", source: "syria", listingId: "x" });
    const b = buildRegionListingKey({ regionCode: "sy", source: "syria", listingId: "x" });
    const c = buildRegionListingKey({ regionCode: "ca_qc", source: "web", listingId: "x" });
    expect(isSameRegionListingKey(a, b)).toBe(true);
    expect(isSameRegionListingKey(a, c)).toBe(false);
  });
});
