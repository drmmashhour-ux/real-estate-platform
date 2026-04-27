import { describe, expect, it } from "vitest";

import { normalizeAcquisitionSource } from "@/lib/growth/acquisitionSourceNormalize";

describe("normalizeAcquisitionSource (Order 50.1)", () => {
  it("lowercases and trims", () => {
    expect(normalizeAcquisitionSource("  TikTok  ")).toBe("tiktok");
  });

  it("maps legacy marketing labels to canonical buckets", () => {
    expect(normalizeAcquisitionSource("facebook")).toBe("meta");
    expect(normalizeAcquisitionSource("instagram")).toBe("meta");
    expect(normalizeAcquisitionSource("gclid")).toBe("google");
    expect(normalizeAcquisitionSource("REF")).toBe("referral");
  });

  it("empty → other", () => {
    expect(normalizeAcquisitionSource("")).toBe("other");
    expect(normalizeAcquisitionSource(null)).toBe("other");
  });
});
