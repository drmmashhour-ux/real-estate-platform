import { describe, expect, it } from "vitest";
import { validateBrokerTaxForm, isValidBusinessNumberNine, isValidGstNumber, isValidQstNumber } from "../quebec-broker-tax";

describe("quebec-broker-tax format validation", () => {
  it("accepts 9-digit BN", () => {
    expect(isValidBusinessNumberNine("123456789")).toBe(true);
    expect(isValidBusinessNumberNine("12345")).toBe(false);
  });
  it("accepts GST pattern", () => {
    expect(isValidGstNumber("123456789RT0001")).toBe(true);
    expect(isValidGstNumber("123456789rt0001")).toBe(true);
    expect(isValidGstNumber("bad")).toBe(false);
    expect(isValidGstNumber("")).toBe(true);
    expect(isValidGstNumber(null)).toBe(true);
  });
  it("accepts QST pattern", () => {
    expect(isValidQstNumber("1234567890TQ0001")).toBe(true);
    expect(isValidQstNumber("1234567890tq0001")).toBe(true);
    expect(isValidQstNumber("")).toBe(false);
  });
  it("requires QST for QC", () => {
    const ok = validateBrokerTaxForm({
      legalName: "Test",
      businessNumberNine: "123456789",
      businessAddress: "1 Main",
      province: "QC",
      qstNumber: "1234567890TQ0001",
    });
    expect(ok.ok).toBe(true);
    const missing = validateBrokerTaxForm({
      legalName: "Test",
      businessNumberNine: "123456789",
      businessAddress: "1 Main",
      province: "QC",
      qstNumber: "",
    });
    expect(missing.ok).toBe(false);
  });
  it("allows empty QST outside QC", () => {
    const r = validateBrokerTaxForm({
      legalName: "Test",
      businessNumberNine: "123456789",
      businessAddress: "1 Main",
      province: "ON",
      qstNumber: "",
    });
    expect(r.ok).toBe(true);
  });
});
