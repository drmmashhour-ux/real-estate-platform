import { describe, expect, it } from "vitest";
import {
  buildSegmentKey,
  buildSimilarityFingerprint,
  stableStringify,
} from "../utils/playbook-memory-fingerprint";
import type { PlaybookComparableContext } from "../types/playbook-memory.types";

describe("playbook-memory-fingerprint", () => {
  it("stableStringify is order-independent for objects", () => {
    const a = stableStringify({ z: 1, a: 2, m: { b: 1, a: 2 } });
    const b = stableStringify({ m: { a: 2, b: 1 }, a: 2, z: 1 });
    expect(a).toBe(b);
  });

  it("fingerprint is stable for equivalent contexts", () => {
    const c1: PlaybookComparableContext = {
      domain: "LEADS",
      entityType: "lead",
      segment: { urgency: "high", budgetBand: "500k-700k" },
      market: { city: "montreal" },
    };
    const c2: PlaybookComparableContext = {
      domain: "LEADS",
      entityType: "lead",
      market: { city: "montreal" },
      segment: { budgetBand: "500k-700k", urgency: "high" },
    };
    expect(buildSimilarityFingerprint(c1)).toBe(buildSimilarityFingerprint(c2));
  });

  it("segmentKey matches spec-style join", () => {
    const c: PlaybookComparableContext = {
      domain: "LEADS",
      entityType: "buyer",
      segment: {
        leadType: "buyer",
        budgetBand: "500k-700k",
        urgency: "high",
      },
    };
    expect(buildSegmentKey(c)).toContain("buyer");
    expect(buildSegmentKey(c)).toContain("500k-700k");
  });
});
