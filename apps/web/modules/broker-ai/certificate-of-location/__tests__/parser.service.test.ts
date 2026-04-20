import { describe, expect, it } from "vitest";
import { extractCertificateOfLocationParsedData } from "../certificate-of-location-parser.service";

describe("extractCertificateOfLocationParsedData", () => {
  it("returns nullish fields for null input", () => {
    const p = extractCertificateOfLocationParsedData(null);
    expect(p).toEqual({});
  });

  it("maps known keys from structured record", () => {
    const p = extractCertificateOfLocationParsedData({
      issue_date: "  2024-06-01  ",
      lot_number: "  1-2-3  ",
      propertyAddress: "10 Main",
    });
    expect(p.issueDate).toBe("2024-06-01");
    expect(p.lotNumber).toBe("1-2-3");
    expect(p.address).toBe("10 Main");
  });
});
