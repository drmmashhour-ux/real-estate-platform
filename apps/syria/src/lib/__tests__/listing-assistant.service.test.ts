import { describe, expect, it } from "vitest";
import {
  extractPriceString,
  inferListingType,
  matchLocationInText,
  normalizeEasternArabicDigits,
  parseListingAssistInput,
} from "@/lib/listing-assistant.service";

describe("listing-assistant.service", () => {
  it("normalizes Eastern Arabic digits", () => {
    expect(normalizeEasternArabicDigits("٣٥٠")).toBe("350");
  });

  it("infers RENT from Arabic", () => {
    expect(inferListingType("شقة للإيجار في المزة")).toBe("RENT");
  });

  it("infers SALE", () => {
    expect(inferListingType("منزل للبيع حلب")).toBe("SALE");
  });

  it("extracts مليون price", () => {
    expect(extractPriceString("السعر ١٢ مليون ليرة")).toBe(String(12_000_000));
  });

  it("matches Damascus city", () => {
    const m = matchLocationInText("شقة في المزة دمشق مطلوب ٥٠ مليون");
    expect(m.cityEn).toBe("Damascus");
    expect(m.governorateEn).toBe("Damascus");
    expect(m.areaAr).toBe("المزة");
  });

  it("parseListingAssistInput returns image URLs", () => {
    const r = parseListingAssistInput({
      rawText: "بيع في حلب https://example.com/a.jpg السعر ٥٠٠٠٠٠٠٠",
      extraImageLines: "",
      facebookUrl: null,
    });
    expect(r.listingType).toBe("SALE");
    expect(r.cityEn).toBe("Aleppo");
    expect(r.imageUrls.some((u) => u.includes("example.com"))).toBe(true);
  });
});
