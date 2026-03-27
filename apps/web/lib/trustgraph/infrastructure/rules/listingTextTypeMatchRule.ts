import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "LISTING_TEXT_TYPE_MATCH_RULE";

function norm(s: string): string {
  return s.toLowerCase();
}

export function evaluateListingTextTypeMatchRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const pt = (ctx.propertyType ?? "").trim();
  const blob = `${ctx.title} ${ctx.description}`.toLowerCase();

  if (!pt) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0.5,
      details: { skipped: true, reason: "no_property_type" },
    };
  }

  const condoHints = ["condo", "condominium", "apartment", "unit ", "studio", "plex"];
  const houseHints = ["detached", "single family", "bungalow", "maison", "duplex", "house"];

  const looksCondo = condoHints.some((h) => blob.includes(h));
  const looksHouse = houseHints.some((h) => blob.includes(h));

  const isCondoType = pt === "CONDO" || norm(pt).includes("condo");
  const isHouseType = pt === "SINGLE_FAMILY" || norm(pt).includes("single") || norm(pt).includes("house");

  if (isHouseType && looksCondo && !looksHouse) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -8,
      confidence: 0.6,
      details: { propertyType: pt, mismatch: "house_type_condo_language" },
      signals: [
        {
          signalCode: `${CODE}_text_mismatch`,
          signalName: "Title/description vs property type",
          category: "quality",
          severity: "medium",
          scoreImpact: -8,
          confidence: 0.6,
          evidence: { propertyType: pt },
          message: "Listing is set as house/single-family but the text reads like a condo or apartment.",
        },
      ],
    };
  }

  if (isCondoType && looksHouse && !looksCondo) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -6,
      confidence: 0.55,
      details: { propertyType: pt, mismatch: "condo_type_house_language" },
      signals: [
        {
          signalCode: `${CODE}_text_mismatch2`,
          signalName: "Title/description vs property type",
          category: "quality",
          severity: "low",
          scoreImpact: -6,
          confidence: 0.55,
          evidence: { propertyType: pt },
          message: "Listing is set as condo but the description emphasizes a detached style — verify accuracy.",
        },
      ],
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: 3,
    confidence: 0.7,
    details: { ok: true },
  };
}
