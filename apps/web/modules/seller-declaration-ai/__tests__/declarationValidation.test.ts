import { describe, expect, it } from "vitest";
import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";

describe("declaration validation", () => {
  it("checks required fields and completeness", () => {
    const out = runDeclarationValidationDeterministic({ property_address: "123 Main", property_type: "condo" });
    expect(out.isValid).toBe(false);
    expect(out.completenessPercent).toBeLessThan(100);
    expect(out.missingFields.length).toBeGreaterThan(0);
  });

  it("detects contradiction flags", () => {
    const out = runDeclarationValidationDeterministic({
      property_address: "123 Main",
      property_type: "condo",
      known_defects_flag: false,
      water_damage_flag: true,
      water_damage_details: "Basement leak",
    });
    expect(out.contradictionFlags.length).toBeGreaterThan(0);
  });
});
