import { describe, it, expect } from "vitest";
import { normalizeListingCode, parseListingCodeFromSearchQuery } from "./listing-code-public";

describe("listing-code", () => {
  it("normalizes LEC codes (case, spacing)", () => {
    expect(normalizeListingCode("lec-10001")).toBe("LEC-10001");
    expect(normalizeListingCode("  LEC-42  ")).toBe("LEC-42");
    expect(normalizeListingCode("LEC10002")).toBe("LEC-10002");
    expect(normalizeListingCode("not-a-code")).toBeNull();
    expect(normalizeListingCode("")).toBeNull();
  });

  it("parses listing code from search box when entire query is a code", () => {
    expect(parseListingCodeFromSearchQuery("LEC-999")).toBe("LEC-999");
    expect(parseListingCodeFromSearchQuery("lec999")).toBe("LEC-999");
    expect(parseListingCodeFromSearchQuery("LST-ABC123")).toBe("LST-ABC123");
    expect(parseListingCodeFromSearchQuery("lstabcdef")).toBe("LST-ABCDEF");
    expect(parseListingCodeFromSearchQuery("LST-000001")).toBe("LST-000001");
    expect(parseListingCodeFromSearchQuery("Montreal")).toBeNull();
    expect(parseListingCodeFromSearchQuery("LEC Montreal")).toBeNull();
  });
});
