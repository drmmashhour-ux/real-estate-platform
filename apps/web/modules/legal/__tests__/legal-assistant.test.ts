import { describe, expect, it } from "vitest";
import { LEGAL_ASSISTANT_DISCLAIMER } from "../legal-disclaimer";
import { applyLegalPlaceholders, generateDocument } from "../legal-assistant";

describe("applyLegalPlaceholders", () => {
  it("substitutes known keys and preserves unknown", () => {
    const s = applyLegalPlaceholders("Hello {{A}} and {{B}}", { A: "x" });
    expect(s).toBe("Hello x and {{B}}");
  });
});

describe("generateDocument", () => {
  it("includes required disclaimer and markdown format", () => {
    const doc = generateDocument({
      documentType: "booking_agreement",
      parties: [
        { role: "host", legalName: "Host Co" },
        { role: "guest", legalName: "Guest Person" },
      ],
      property: { address: "1 Main", city: "Montreal" },
      dates: { effectiveDate: "2026-01-01", checkIn: "2026-02-01", checkOut: "2026-02-05" },
      terms: { currency: "CAD", totalAmount: "500", depositAmount: "100" },
      clauses: { includeCancellation: false, includePaymentTerms: false, includeLiability: false },
    });
    expect(doc.notLegalAdvice).toBe(true);
    expect(doc.editableFormat).toBe("markdown");
    expect(doc.disclaimer).toBe(LEGAL_ASSISTANT_DISCLAIMER);
    expect(doc.fullDocument.includes(LEGAL_ASSISTANT_DISCLAIMER)).toBe(true);
    expect(doc.fullDocument.includes("Host Co")).toBe(true);
    expect(doc.fullDocument.includes("Guest Person")).toBe(true);
  });
});
