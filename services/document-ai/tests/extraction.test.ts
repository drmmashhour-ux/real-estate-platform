import { describe, it, expect } from "vitest";
import { parseLandRegisterText } from "../src/parsers/land-register-parser";

describe("land-register-parser", () => {
  it("extracts cadastre number", () => {
    const text = "Numéro de lot: 1234567\nPropriétaire: Jean Dupont";
    const r = parseLandRegisterText(text);
    expect(r.cadastre_number).toBeTruthy();
    expect(r.owner_name).toContain("Jean Dupont");
    expect(r.confidence_score).toBeGreaterThan(0);
  });

  it("extracts owner and address", () => {
    const text = `
      Propriétaire: Marie Martin
      Adresse: 123 rue Principale, Montréal, QC
      Municipalité: Montréal
    `;
    const r = parseLandRegisterText(text);
    expect(r.owner_name).toBeTruthy();
    expect(r.property_address).toBeTruthy();
    expect(r.municipality).toBeTruthy();
  });

  it("returns low confidence for empty text", () => {
    const r = parseLandRegisterText("");
    expect(r.confidence_score).toBe(0);
    expect(r.cadastre_number).toBeNull();
  });
});
