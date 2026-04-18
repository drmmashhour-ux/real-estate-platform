import { describe, expect, it } from "vitest";
import { pickListingDescription, pickListingTitle } from "../listing-localized";

describe("listing localization", () => {
  const row = {
    titleAr: "عنوان",
    titleEn: "Title EN",
    descriptionAr: "وصف",
    descriptionEn: "Desc EN",
  };

  it("picks English title when locale is en", () => {
    expect(pickListingTitle(row, "en")).toBe("Title EN");
  });

  it("falls back to Arabic title when EN empty", () => {
    expect(pickListingTitle({ titleAr: "ع", titleEn: null }, "en")).toBe("ع");
  });

  it("picks Arabic for ar locale", () => {
    expect(pickListingTitle(row, "ar")).toBe("عنوان");
    expect(pickListingDescription(row, "ar")).toBe("وصف");
  });
});
