import { isCondoPropertyType } from "@/lib/fsbo/seller-declaration-validation";
import { migrateLegacySellerDeclaration } from "@/lib/fsbo/seller-declaration-schema";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "CONDO_UNIT_REQUIRED_RULE";

export function evaluateCondoUnitRequiredRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const pt = ctx.propertyType;
  const decl = migrateLegacySellerDeclaration(ctx.sellerDeclarationJson);
  const unit = (decl.propertyAddressStructured?.unit ?? "").trim();
  const condo = isCondoPropertyType(pt);

  if (!condo) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 1,
      details: { skipped: true, reason: "not_condo_type" },
    };
  }

  if (!unit) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -14,
      confidence: 0.95,
      details: { propertyType: pt, unitPresent: false },
      signals: [
        {
          signalCode: "CONDO_UNIT_MISSING",
          signalName: "Condominium unit number missing",
          category: "address",
          severity: "high",
          scoreImpact: -14,
          confidence: 0.95,
          evidence: { propertyType: pt },
          message: "Add a unit / apartment number for this condominium listing.",
        },
      ],
      recommendedActions: [
        {
          actionCode: "ADD_UNIT_NUMBER",
          title: "Add unit number",
          description: "Enter the unit or apartment number in the structured address.",
          priority: "urgent",
          actorType: "user",
        },
      ],
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: 5,
    confidence: 0.9,
    details: { unitPresent: true },
  };
}
