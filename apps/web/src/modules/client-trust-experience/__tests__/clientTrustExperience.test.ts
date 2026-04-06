import { describe, expect, it } from "vitest";
import { composeClientTrustExperience } from "@/src/modules/client-trust-experience/application/composeClientTrustExperience";
import { computeTrustBadge, getClientDocumentStatus } from "@/src/modules/client-trust-experience/application/getClientDocumentStatus";
import { generateClientSummary } from "@/src/modules/client-trust-experience/application/generateClientSummary";
import { generateSectionExplanation } from "@/src/modules/client-trust-experience/application/generateSectionExplanation";
import { RiskHighlightSeverity, TrustBadgeVariant } from "@/src/modules/client-trust-experience/domain/clientExperience.enums";
import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";

describe("client trust experience", () => {
  it("generateClientSummary uses payload only for price when present", () => {
    const s = generateClientSummary({ list_price: 500000, owner_occupied: true }, null);
    expect(s.priceLine).toContain("500");
    expect(s.conditions.some((c) => c.includes("Owner"))).toBe(true);
  });

  it("section explanation includes disclaimer and schema grounding", () => {
    const ex = generateSectionExplanation("property_identity", {
      property_address: "1 Main St",
      property_type: "condo",
      year_built: "1999",
    });
    expect(ex.whatItMeans.toLowerCase()).toContain("property");
    expect(ex.disclaimer.toLowerCase()).toContain("not legal advice");
    expect(ex.whatToCheck.length).toBeGreaterThan(0);
  });

  it("trust badge is not ready when missing fields", () => {
    const v = runDeclarationValidationDeterministic({});
    expect(computeTrustBadge(v)).toBe(TrustBadgeVariant.NotReady);
  });

  it("trust badge is verified when clean payload", () => {
    const payload: Record<string, unknown> = {
      property_address: "1 Main St",
      property_type: "condo",
      ownership_type: "divided_coownership",
      owner_occupied: true,
      known_defects_flag: false,
      water_damage_flag: false,
      structural_issues_flag: false,
      renovations_flag: false,
      legal_dispute_flag: false,
      environmental_flag: false,
      inclusions: "Fridge",
      exclusions: "",
      tenant_present: false,
      condo_syndicate_documents_available: true,
      condo_financial_statements_available: true,
      contingency_fund_details: "Healthy contingency fund with no urgent special assessment on file.",
      additional_notes: "",
    };
    const v = runDeclarationValidationDeterministic(payload);
    expect(v.missingFields.length).toBe(0);
    expect(computeTrustBadge(v)).toBe(TrustBadgeVariant.Verified);
    const st = getClientDocumentStatus(v);
    expect(st.readyToSign).toBe(true);
  });

  it("risk highlights map missing fields to blockers", () => {
    const v = runDeclarationValidationDeterministic({});
    const bundle = composeClientTrustExperience({}, v, null);
    expect(bundle.risks.some((r) => r.severity === RiskHighlightSeverity.Blocker)).toBe(true);
  });

  it("composeClientTrustExperience lists all declaration sections", () => {
    const v = runDeclarationValidationDeterministic({ property_address: "x" });
    const bundle = composeClientTrustExperience({ property_address: "x" }, v, null);
    expect(bundle.sections.length).toBeGreaterThan(5);
  });
});
