import { describe, expect, it } from "vitest";
import { canTransition } from "../review";
import { resolveCreationMode } from "../creation-mode";
import { detectListingOpportunities, formatOpportunityMessage } from "@/lib/growth/detect-content-opportunities";
import { HIGH_RISK_SURFACES, requiresReviewBeforePublish } from "../policies";

describe("content workflow", () => {
  it("canTransition respects review lifecycle", () => {
    expect(canTransition("draft", "pending_review")).toBe(true);
    expect(canTransition("pending_review", "approved")).toBe(true);
    expect(canTransition("pending_review", "rejected")).toBe(true);
    expect(canTransition("approved", "published")).toBe(false);
    expect(canTransition("rejected", "draft")).toBe(true);
  });

  it("resolveCreationMode picks translate when EN source approved", () => {
    expect(
      resolveCreationMode({
        targetLocale: "fr",
        hasApprovedEnglishSource: true,
        culturalAdaptation: false,
      }),
    ).toBe("translate_from_source");
    expect(
      resolveCreationMode({
        targetLocale: "en",
        hasApprovedEnglishSource: true,
        culturalAdaptation: false,
      }),
    ).toBe("generate_native");
  });

  it("resolveCreationMode prefers hybrid for cultural adaptation", () => {
    expect(
      resolveCreationMode({
        targetLocale: "fr",
        hasApprovedEnglishSource: true,
        culturalAdaptation: true,
      }),
    ).toBe("hybrid_localize");
  });

  it("high-risk surfaces require review policy", () => {
    expect(requiresReviewBeforePublish("notification")).toBe(true);
    expect(HIGH_RISK_SURFACES.has("email_campaign")).toBe(true);
  });

  it("detectListingOpportunities surfaces Syria banner", () => {
    const opps = detectListingOpportunities([], {
      locale: "en",
      marketCode: "syria",
      syriaContactFirst: true,
    });
    expect(opps.some((o) => o.surfaceHint === "market_banner")).toBe(true);
    const msg = formatOpportunityMessage("fr", opps.find((o) => o.surfaceHint === "market_banner")!);
    expect(msg.length).toBeGreaterThan(5);
  });
});
