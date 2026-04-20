import { describe, expect, it } from "vitest";
import { pickListingDescription, pickListingTitle } from "../listing-localized";
import { getLocalizedPropertyCity, getLocalizedPropertyDistrict } from "../property-localization";

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

  it("city EN prefers cityEn then cityAr", () => {
    const loc = {
      city: "Damascus",
      cityAr: "دمشق",
      cityEn: "Damascus",
      area: null,
      districtAr: null,
      districtEn: null,
    };
    expect(getLocalizedPropertyCity(loc, "en")).toBe("Damascus");
    expect(getLocalizedPropertyCity(loc, "ar")).toBe("دمشق");
  });

  it("district falls back to area when bilingual district missing", () => {
    const loc = {
      city: "Damascus",
      cityAr: null,
      cityEn: null,
      area: "المزة",
      districtAr: null,
      districtEn: null,
    };
    expect(getLocalizedPropertyDistrict(loc, "ar")).toBe("المزة");
  });
});
