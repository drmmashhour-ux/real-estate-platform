import { describe, expect, it } from "vitest";
import { emptyParty, emptySellerDeclaration } from "@/lib/fsbo/seller-declaration-schema";
import {
  findDuplicateSellerIds,
  validateSellerDeclarationIntegrity,
  validateStructuredAddressVsPropertyType,
} from "@/lib/fsbo/seller-declaration-validation";

function baseDeclaration() {
  const d = emptySellerDeclaration();
  d.propertyAddressStructured = {
    street: "123 Main St",
    unit: "",
    city: "Montreal",
    postalCode: "H2X1Y1",
  };
  d.hasAuthorityToSell = true;
  d.identityNotes = "Owner on title.";
  d.sharedContactResponsibilityConfirmed = false;
  return d;
}

describe("validateStructuredAddressVsPropertyType", () => {
  it("flags condo without unit", () => {
    const r = validateStructuredAddressVsPropertyType("CONDO", {
      street: "1 Rue X",
      unit: "",
      city: "Montreal",
      postalCode: "H2X1Y1",
    });
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.warnings.some((w) => w.includes("verify"))).toBe(true);
  });

  it("flags house with unit", () => {
    const r = validateStructuredAddressVsPropertyType("SINGLE_FAMILY", {
      street: "10 Oak",
      unit: "3",
      city: "Montreal",
      postalCode: "H2X1Y1",
    });
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("accepts matching condo + unit", () => {
    const r = validateStructuredAddressVsPropertyType("CONDO", {
      street: "1 Rue X",
      unit: "402",
      city: "Montreal",
      postalCode: "H2X1Y1",
    });
    expect(r.errors).toHaveLength(0);
  });
});

describe("duplicate ID", () => {
  it("detects duplicate seller IDs", () => {
    const a = emptyParty();
    const b = emptyParty();
    a.idNumber = "ABC123";
    b.idNumber = "ABC123";
    const { indices } = findDuplicateSellerIds([a, b]);
    expect(indices.length).toBe(1);
    expect(indices[0]).toEqual([0, 1]);
  });
});

describe("validateSellerDeclarationIntegrity", () => {
  it("valid case: house address + unique sellers", () => {
    const d = baseDeclaration();
    d.sellers = [
      {
        ...emptyParty(),
        idType: "PASSPORT",
        idNumber: "P1",
        fullName: "Ann",
        dateOfBirth: "1990-01-01",
        occupation: "Eng",
        annualIncome: "80000",
        phone: "5145550100",
        email: "a@example.com",
        sharedContact: false,
        idDocumentUrl: "https://x",
        idDocumentVerificationStatus: "none",
      },
    ];
    const v = validateSellerDeclarationIntegrity(d, "SINGLE_FAMILY");
    expect(v.ok).toBe(true);
  });

  it("invalid: duplicate ID", () => {
    const d = baseDeclaration();
    const p = {
      ...emptyParty(),
      idType: "PASSPORT" as const,
      idNumber: "SAME",
      fullName: "Ann",
      dateOfBirth: "1990-01-01",
      occupation: "Eng",
      annualIncome: "80000",
      phone: "5145550101",
      email: "a@example.com",
      sharedContact: false,
      idDocumentUrl: "https://x",
      idDocumentVerificationStatus: "none" as const,
    };
    const q = { ...p, id: emptyParty().id, fullName: "Bob", email: "b@example.com", phone: "5145550102" };
    d.sellers = [p, q];
    const v = validateSellerDeclarationIntegrity(d, "SINGLE_FAMILY");
    expect(v.ok).toBe(false);
    expect(v.fieldErrors["sellers.0.idNumber"]).toBeTruthy();
  });

  it("edge: shared phone with responsibility ack", () => {
    const d = baseDeclaration();
    const p = {
      ...emptyParty(),
      idType: "PASSPORT" as const,
      idNumber: "P1",
      fullName: "Ann",
      dateOfBirth: "1990-01-01",
      occupation: "Eng",
      annualIncome: "80000",
      phone: "5145550199",
      email: "a@example.com",
      sharedContact: true,
      idDocumentUrl: "https://x",
      idDocumentVerificationStatus: "none" as const,
    };
    const q = {
      ...p,
      id: emptyParty().id,
      idNumber: "P2",
      fullName: "Bob",
      email: "b@example.com",
      sharedContact: true,
    };
    d.sellers = [p, q];
    d.sharedContactResponsibilityConfirmed = true;
    const v = validateSellerDeclarationIntegrity(d, "SINGLE_FAMILY");
    expect(v.ok).toBe(true);
  });
});
