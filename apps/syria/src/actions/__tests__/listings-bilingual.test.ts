import { describe, expect, it } from "vitest";
import { validateBilingualListingCopy } from "@/lib/listing-bilingual-validation";

describe("validateBilingualListingCopy", () => {
  it("requires Arabic title only (ORDER SYBNB-88 — optional description)", () => {
    expect(validateBilingualListingCopy({ titleAr: "", descriptionAr: "وصف" }).ok).toBe(false);
    expect(validateBilingualListingCopy({ titleAr: "", descriptionAr: "وصف" }).reason).toBe("missing_title_ar");
    expect(validateBilingualListingCopy({ titleAr: "عنوان", descriptionAr: "   " }).ok).toBe(true);
    expect(validateBilingualListingCopy({ titleAr: "عنوان", descriptionAr: "وصف" }).ok).toBe(true);
  });

  it("allows null or empty English fields when Arabic is valid", () => {
    expect(
      validateBilingualListingCopy({
        titleAr: "ع",
        descriptionAr: "و",
        titleEn: null,
        descriptionEn: null,
      }).ok,
    ).toBe(true);
    expect(
      validateBilingualListingCopy({
        titleAr: "ع",
        descriptionAr: "و",
        titleEn: "",
        descriptionEn: "",
      }).ok,
    ).toBe(true);
  });

  it("treats whitespace-only Arabic title as invalid", () => {
    expect(validateBilingualListingCopy({ titleAr: " \n\t ", descriptionAr: "وصف" }).ok).toBe(false);
    expect(validateBilingualListingCopy({ titleAr: "عنوان", descriptionAr: "\n" }).ok).toBe(true);
  });
});
