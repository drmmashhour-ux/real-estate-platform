import { describe, expect, it } from "vitest";
import {
  FRENCH_VERSION_REQUIRED_MESSAGE,
  validateFrenchPublicListingContent,
  validateResidentialScopeForPublish,
} from "@/lib/compliance/quebec/language-compliance.guard";
import { DEFAULT_QUEBEC_LANGUAGE_POLICY } from "@/lib/compliance/quebec/language-policy";

describe("validateFrenchPublicListingContent", () => {
  it("blocks English-primary listing without substantive French", () => {
    const out = validateFrenchPublicListingContent(
      {
        title: "Beautiful spacious home with garage",
        titleFr: "",
        assistantDraftContent: null,
      },
      DEFAULT_QUEBEC_LANGUAGE_POLICY,
    );
    expect(out.ok).toBe(false);
    expect(out.violations.some((v) => v.message === FRENCH_VERSION_REQUIRED_MESSAGE)).toBe(true);
  });

  it("allows listing with professional French title", () => {
    const out = validateFrenchPublicListingContent(
      {
        title: "Beautiful home",
        titleFr: "Magnifique propriété unifamiliale à vendre",
        assistantDraftContent: null,
      },
      DEFAULT_QUEBEC_LANGUAGE_POLICY,
    );
    expect(out.ok).toBe(true);
  });

  it("skips when policy disables French requirement", () => {
    const out = validateFrenchPublicListingContent(
      {
        title: "English only",
        titleFr: "",
        assistantDraftContent: null,
      },
      { ...DEFAULT_QUEBEC_LANGUAGE_POLICY, requireFrenchForPublicContent: false },
    );
    expect(out.ok).toBe(true);
  });
});

describe("validateResidentialScopeForPublish", () => {
  it("flags commercial broker wording", () => {
    const out = validateResidentialScopeForPublish({
      marketingText: "I am a commercial broker for this office tower.",
      licenceType: "residential",
    });
    expect(out.ok).toBe(false);
    expect(out.violations.some((v) => v.code === "COMMERCIAL_SCOPE_LEAK")).toBe(true);
  });

  it("rejects non-residential licence category", () => {
    const out = validateResidentialScopeForPublish({
      marketingText: "Maison à vendre",
      licenceType: "commercial",
    });
    expect(out.ok).toBe(false);
    expect(out.violations.some((v) => v.code === "LICENCE_SCOPE")).toBe(true);
  });
});
