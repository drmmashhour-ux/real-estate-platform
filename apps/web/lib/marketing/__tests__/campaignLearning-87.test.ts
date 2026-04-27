import { describe, expect, it } from "vitest";
import { generateAdCopy } from "@/lib/marketing/adCopyEngine";
import {
  extractPatternFromCopy,
  order87ClassifyGroup,
} from "@/lib/marketing/campaignLearningPure";

describe("Order 87 — pattern labels", () => {
  it("urgency in headline", () => {
    expect(
      extractPatternFromCopy("Limited: act now on listings in MTL", "Body", "meta")
    ).toBe("urgency-driven headline");
  });

  it("trust in body", () => {
    expect(extractPatternFromCopy("Headline", "Verified, secure, trusted process.", "meta")).toBe("trust-focused copy");
  });

  it("value in body", () => {
    expect(extractPatternFromCopy("Headline", "Save 20% on your first booking.", "meta")).toBe("value-focused copy");
  });

  it("TikTok question hook", () => {
    expect(extractPatternFromCopy("Need a better stay in MTL?", "Body without trust/value.", "tiktok")).toBe(
      "question-based hook"
    );
  });

  it("default general", () => {
    expect(extractPatternFromCopy("Steady headline", "Neutral descriptive body.", "google")).toBe("general marketplace copy");
  });
});

describe("Order 87 — group classification", () => {
  it("n < 3 is neutral", () => {
    expect(order87ClassifyGroup(2, 0.1, 0.1)).toBe("neutral");
  });

  it("3 strong rows → win", () => {
    expect(order87ClassifyGroup(3, 0.04, 0.06)).toBe("win");
  });

  it("3 weak ctr rows → weak", () => {
    expect(order87ClassifyGroup(3, 0.01, 0.1)).toBe("weak");
  });
});

describe("Order 87 — copy base preserved when adding learned (shape)", () => {
  it("sync generateAdCopy has no learnedVariant on its own", () => {
    const a = generateAdCopy({ audience: "buyer", city: "Montreal" });
    expect("learnedVariant" in a).toBe(false);
  });
});
