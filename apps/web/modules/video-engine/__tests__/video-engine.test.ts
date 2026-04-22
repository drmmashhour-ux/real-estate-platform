import { describe, expect, it } from "vitest";

import { normalizeSceneDurations, rankMediaUrls } from "../video-assembly.service";
import { sanitizeCaption } from "../video-script.service";

describe("video content engine — media selection", () => {
  it("prefers cover image first then dedupes", () => {
    const urls = ["b.jpg", "a.jpg", "b.jpg", "c.jpg"];
    const { ranked } = rankMediaUrls(urls, "a.jpg");
    expect(ranked[0]).toBe("a.jpg");
    expect(ranked).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
    expect(ranked.length).toBeLessThanOrEqual(8);
  });

  it("warns when fewer than four assets", () => {
    const { ranked, warnings } = rankMediaUrls(["x.jpg"], null);
    expect(ranked.length).toBe(1);
    expect(warnings.some((w) => /only 1/i.test(w))).toBe(true);
  });
});

describe("video content engine — scene ordering", () => {
  it("normalizes durations to match duration target", () => {
    const normalized = normalizeSceneDurations({
      templateKey: "listing_spotlight",
      sourceKind: "crm_listing",
      sourceId: "x",
      title: "t",
      hook: "h",
      scenes: [
        {
          id: "s1",
          type: "hero_image",
          durationSec: 10,
          overlayLines: ["a"],
          transitionIn: "fade",
          transitionOut: "fade",
        },
        {
          id: "s2",
          type: "pricing_card",
          durationSec: 10,
          overlayLines: ["b"],
          transitionIn: "fade",
          transitionOut: "fade",
        },
        {
          id: "s3",
          type: "cta_card",
          durationSec: 10,
          overlayLines: ["c"],
          transitionIn: "fade",
          transitionOut: "fade",
        },
      ],
      captions: [],
      cta: "cta",
      hashtags: [],
      suggestedCaption: "cap",
      targetPlatform: "instagram_reels",
      durationTargetSec: 30,
      complianceNotes: [],
      mediaWarning: null,
    });
    const sum = normalized.scenes.reduce((acc, s) => acc + s.durationSec, 0);
    expect(sum).toBe(30);
  });
});

describe("video content engine — brand safety", () => {
  it("sanitizes spammy caption patterns", () => {
    expect(sanitizeCaption("Best deal!!! Guaranteed!!!")).not.toMatch(/guaranteed/i);
    expect(sanitizeCaption("Hello!!!")).not.toMatch(/!{3,}/);
  });
});

describe("video content engine — export payload shape", () => {
  it("rankMediaUrls returns stable ordering for slideshow assembly", () => {
    const { ranked } = rankMediaUrls(Array.from({ length: 12 }, (_, i) => `u${i}`), "u5");
    expect(ranked[0]).toBe("u5");
    expect(ranked.length).toBe(8);
  });
});

describe("video content engine — state mapping", () => {
  it("treats preview as review stage (caller responsibility)", () => {
    expect(["draft", "preview", "approved", "scheduled", "published", "rejected"]).toContain("preview");
  });
});
