import { describe, expect, it } from "vitest";
import { normalizeListingDescription } from "./normalize-listing-description";

describe("normalizeListingDescription", () => {
  it("trims and collapses whitespace", () => {
    const { text, changed } = normalizeListingDescription("  hello   world  ");
    expect(text).toBe("hello world");
    expect(changed).toBe(true);
  });

  it("limits consecutive newlines", () => {
    const { text } = normalizeListingDescription("a\n\n\n\nb");
    expect(text).toBe("a\n\nb");
  });
});
