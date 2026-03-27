import { missingDeclarationSections, migrateLegacySellerDeclaration } from "@/lib/fsbo/seller-declaration-schema";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "DECLARATION_REQUIRED_SECTIONS_RULE";

export function evaluateDeclarationRequiredSectionsRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const partial = migrateLegacySellerDeclaration(ctx.sellerDeclarationJson);
  const missing = missingDeclarationSections(partial, ctx.propertyType);

  if (missing.length > 0) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -12,
      confidence: 0.9,
      details: { missingSections: missing },
      signals: [
        {
          signalCode: "DECLARATION_INCOMPLETE",
          signalName: "Seller declaration sections incomplete",
          category: "legal",
          severity: missing.length > 4 ? "high" : "medium",
          scoreImpact: -12,
          confidence: 0.9,
          evidence: { missing },
          message: `Complete declaration sections: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "…" : ""}.`,
        },
      ],
      recommendedActions: [
        {
          actionCode: "COMPLETE_SELLER_DECLARATION_SECTION",
          title: "Complete seller declaration",
          description: "Finish required sections in Seller Hub.",
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
    scoreDelta: 8,
    confidence: 0.85,
    details: { sectionsComplete: true },
  };
}
