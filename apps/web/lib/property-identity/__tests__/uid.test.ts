import { describe, it, expect } from "vitest";
import { generatePropertyUid } from "../uid";

describe("generatePropertyUid", () => {
  it("generates deterministic UID from same inputs", () => {
    const input = {
      cadastreNumber: "12345-67",
      officialAddress: "123 Main Street",
      municipality: "Montreal",
      province: "QC",
      country: "CA",
    };
    const a = generatePropertyUid(input);
    const b = generatePropertyUid(input);
    expect(a).toBe(b);
    expect(a.startsWith("pid_")).toBe(true);
    expect(a.length).toBeGreaterThan(10);
  });

  it("same property with different address formatting yields same UID when normalized", () => {
    const a = generatePropertyUid({
      cadastreNumber: "12345",
      officialAddress: "123 Main St",
      municipality: "Montreal",
      province: "QC",
    });
    const b = generatePropertyUid({
      cadastreNumber: "12345",
      officialAddress: "123 main st",
      municipality: "montreal",
      province: "qc",
    });
    expect(a).toBe(b);
  });

  it("different cadastre yields different UID", () => {
    const base = { officialAddress: "123 Main St", municipality: "Montreal", province: "QC" };
    const a = generatePropertyUid({ ...base, cadastreNumber: "A" });
    const b = generatePropertyUid({ ...base, cadastreNumber: "B" });
    expect(a).not.toBe(b);
  });

  it("different address yields different UID", () => {
    const base = { cadastreNumber: "123", municipality: "Montreal", province: "QC" };
    const a = generatePropertyUid({ ...base, officialAddress: "123 Main St" });
    const b = generatePropertyUid({ ...base, officialAddress: "456 Oak Ave" });
    expect(a).not.toBe(b);
  });
});
