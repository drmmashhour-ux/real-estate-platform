import { migrateLegacySellerDeclaration } from "@/lib/fsbo/seller-declaration-schema";
import { validateSellerDeclarationIntegrity } from "@/lib/fsbo/seller-declaration-validation";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "DECLARATION_MANDATORY_FIELDS_RULE";

export function evaluateDeclarationMandatoryFieldsRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const partial = migrateLegacySellerDeclaration(ctx.sellerDeclarationJson);
  const v = validateSellerDeclarationIntegrity(partial, ctx.propertyType);

  if (!v.ok || v.errors.length > 0) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -14,
      confidence: 0.9,
      details: { errors: v.errors, fieldErrors: v.fieldErrors },
      signals: [
        {
          signalCode: `${CODE}_integrity`,
          signalName: "Seller declaration validation errors",
          category: "legal",
          severity: "high",
          scoreImpact: -14,
          confidence: 0.9,
          evidence: { errors: v.errors.slice(0, 8) },
          message: v.errors[0] ?? "Fix mandatory declaration fields before approval.",
        },
      ],
      recommendedActions: [
        {
          actionCode: "FIX_MANDATORY_DECLARATION_FIELDS",
          title: "Fix declaration errors",
          description: "Resolve validation errors shown in Seller Hub.",
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
    scoreDelta: 10,
    confidence: 0.9,
    details: { ok: true },
  };
}
