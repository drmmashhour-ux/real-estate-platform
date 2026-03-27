import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

const CODE = "listing_type_consistency";
const VERSION = "1";

function norm(s: string): string {
  return s.toLowerCase();
}

export function evaluateListingTypeConsistencyRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const pt = (ctx.propertyType ?? "").trim();
  const blob = `${ctx.title} ${ctx.description}`.toLowerCase();
  if (!pt) {
    return {
      ruleCode: CODE,
      ruleVersion: VERSION,
      passed: false,
      scoreDelta: -5,
      confidence: 0.6,
      details: { reason: "missing_property_type" },
      signals: [
        {
          signalCode: `${CODE}_missing_pt`,
          signalName: "Property type not set",
          category: "quality",
          severity: "medium",
          scoreImpact: -5,
          confidence: 0.6,
          evidence: {},
          message: "Set property type so buyers and verification can align with the description.",
        },
      ],
    };
  }

  const condoHints = ["condo", "condominium", "apartment", "plex unit"];
  const houseHints = ["detached", "single family", "maison", "bungalow", "house"];

  const looksCondo = condoHints.some((h) => blob.includes(h));
  const looksHouse = houseHints.some((h) => blob.includes(h));

  const isCondoType = pt === "CONDO" || norm(pt).includes("condo");
  const isHouseType = pt === "SINGLE_FAMILY" || norm(pt).includes("single") || norm(pt).includes("house");

  if (isHouseType && looksCondo && !looksHouse) {
    return {
      ruleCode: CODE,
      ruleVersion: VERSION,
      passed: false,
      scoreDelta: -10,
      confidence: 0.65,
      details: { propertyType: pt, mismatch: "house_type_condo_language" },
      signals: [
        {
          signalCode: `${CODE}_mismatch`,
          signalName: "Listing type vs copy mismatch",
          category: "quality",
          severity: "high",
          scoreImpact: -10,
          confidence: 0.65,
          evidence: { propertyType: pt },
          message:
            "Property is set as house/single-family but the description reads like a condo or apartment. Please verify.",
        },
      ],
    };
  }

  if (isCondoType && looksHouse && !looksCondo) {
    return {
      ruleCode: CODE,
      ruleVersion: VERSION,
      passed: false,
      scoreDelta: -8,
      confidence: 0.6,
      details: { propertyType: pt, mismatch: "condo_type_house_language" },
      signals: [
        {
          signalCode: `${CODE}_mismatch2`,
          signalName: "Listing type vs copy mismatch",
          category: "quality",
          severity: "medium",
          scoreImpact: -8,
          confidence: 0.6,
          evidence: { propertyType: pt },
          message: "Property is set as condo but the description emphasizes a detached house style. Please verify.",
        },
      ],
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: VERSION,
    passed: true,
    scoreDelta: 4,
    confidence: 0.75,
    details: { ok: true },
  };
}
