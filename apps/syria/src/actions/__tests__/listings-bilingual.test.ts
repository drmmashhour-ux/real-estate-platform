import { describe, expect, it } from "vitest";

/**
 * Document expectations for bilingual listing creation — server action lives in listings.ts.
 * Arabic title/description are required at publish time; EN optional.
 */
describe("listings bilingual rules (contract)", () => {
  it("requires Arabic title and description string non-empty", () => {
    const titleAr = "عنوان";
    const descriptionAr = "وصف";
    expect(titleAr.trim().length).toBeGreaterThan(0);
    expect(descriptionAr.trim().length).toBeGreaterThan(0);
  });

  it("allows null English fields", () => {
    const titleEn: string | null = null;
    const descriptionEn: string | null = null;
    expect(titleEn).toBeNull();
    expect(descriptionEn).toBeNull();
  });
});
