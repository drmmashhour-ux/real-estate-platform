import { describe, it, expect } from "vitest";
import { formatSocialCaption } from "../caption-format";

describe("formatSocialCaption", () => {
  it("places hashtags after body and CTA", () => {
    const s = formatSocialCaption({
      caption: "Line one.\nLine two.",
      hashtags: ["stay", "bnb", "stay"],
      cta: "Book now",
    });
    expect(s).toContain("Line one.");
    expect(s.indexOf("Book now")).toBeLessThan(s.indexOf("#stay"));
    expect(s.endsWith("#stay #bnb")).toBe(true);
  });
});
