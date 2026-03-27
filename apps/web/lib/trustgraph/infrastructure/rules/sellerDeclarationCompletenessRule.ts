import { missingDeclarationSections, migrateLegacySellerDeclaration } from "@/lib/fsbo/seller-declaration-schema";
import { validateSellerDeclarationIntegrity } from "@/lib/fsbo/seller-declaration-validation";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

const CODE = "seller_declaration_completeness";
const VERSION = "1";

export function evaluateSellerDeclarationCompletenessRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const partial = migrateLegacySellerDeclaration(ctx.sellerDeclarationJson);
  const v = validateSellerDeclarationIntegrity(partial, ctx.propertyType);
  const missing = missingDeclarationSections(partial, ctx.propertyType);

  if (!v.ok || missing.length > 0) {
    return {
      ruleCode: CODE,
      ruleVersion: VERSION,
      passed: false,
      scoreDelta: -18,
      confidence: 0.9,
      details: { errors: v.errors, missingSections: missing },
      signals: [
        {
          signalCode: `${CODE}_incomplete`,
          signalName: "Seller declaration incomplete or invalid",
          category: "legal",
          severity: missing.length > 3 ? "high" : "medium",
          scoreImpact: -18,
          confidence: 0.9,
          evidence: { missing, fieldErrors: v.fieldErrors },
          message:
            missing.length > 0
              ? `Complete declaration sections: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "…" : ""}.`
              : "Fix seller declaration validation errors before approval.",
        },
      ],
      recommendedActions: [
        {
          actionCode: "open_seller_declaration",
          title: "Complete seller declaration",
          description: "Finish required disclosure sections in Seller Hub.",
          priority: "urgent",
          actorType: "user",
        },
      ],
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: VERSION,
    passed: true,
    scoreDelta: 12,
    confidence: 0.9,
    details: { sectionsOk: true },
  };
}
