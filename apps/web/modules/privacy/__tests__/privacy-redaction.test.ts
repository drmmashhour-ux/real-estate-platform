import { describe, expect, it } from "vitest";
import { PrivacyRedactionService } from "../services/privacy-redaction.service";

describe("PrivacyRedactionService", () => {
  it("should redact sensitive fields for Centris", () => {
    const data = {
      title: "Beautiful House",
      price: 500000,
      sin: "123-456-789",
      idNumber: "ABC123456",
      phone: "514-555-0000",
      personalEmail: "owner@example.com"
    };

    const redacted = PrivacyRedactionService.redactForInformationDisseminationService(data);

    expect(redacted.title).toBe("Beautiful House");
    expect(redacted.price).toBe(500000);
    expect(redacted.sin).toBeUndefined();
    expect(redacted.idNumber).toBeUndefined();
    expect(redacted.phone).toBeUndefined();
    expect(redacted.personalEmail).toBeUndefined();
  });

  it("should redact identifying details for comparables", () => {
    const data = {
      addressLine1: "123 Hidden St",
      unitNumber: "404",
      ownerName: "John Doe",
      beds: 3,
      baths: 2,
      soldPrice: 600000
    };

    const redacted = PrivacyRedactionService.redactForComparables(data);

    expect(redacted.beds).toBe(3);
    expect(redacted.baths).toBe(2);
    expect(redacted.soldPrice).toBe(600000);
    expect(redacted.addressLine1).toBeUndefined();
    expect(redacted.unitNumber).toBeUndefined();
    expect(redacted.ownerName).toBeUndefined();
  });

  it("should redact phone numbers in inspection reports", () => {
    const text = "Inspector called 514-123-4567 to confirm arrival.";
    const redacted = PrivacyRedactionService.redactInspectionReport(text);
    expect(redacted).toContain("[PHONE REDACTED]");
    expect(redacted).not.toContain("514-123-4567");
  });
});
