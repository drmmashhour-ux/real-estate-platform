import { isCondoPropertyType, isHouseLikePropertyType } from "@/lib/fsbo/seller-declaration-validation";
import { migrateLegacySellerDeclaration } from "@/lib/fsbo/seller-declaration-schema";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "PROPERTY_TYPE_METADATA_MATCH_RULE";

export function evaluatePropertyTypeMetadataMatchRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const decl = migrateLegacySellerDeclaration(ctx.sellerDeclarationJson);
  const listingCondo = isCondoPropertyType(ctx.propertyType);
  const declCondo = decl.isCondo === true;

  if (listingCondo !== declCondo) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -10,
      confidence: 0.8,
      details: { listingCondo, declarationIsCondo: declCondo },
      signals: [
        {
          signalCode: `${CODE}_condo_mismatch`,
          signalName: "Listing type vs declaration condo flag",
          category: "quality",
          severity: "medium",
          scoreImpact: -10,
          confidence: 0.8,
          evidence: { propertyType: ctx.propertyType, isCondo: decl.isCondo },
          message:
            "The listing property type and the seller declaration (condo vs not) do not match. Align both.",
        },
      ],
      recommendedActions: [
        {
          actionCode: "ALIGN_PROPERTY_TYPE_DECLARATION",
          title: "Align property type",
          description: "Update listing property type or declaration condo section so they agree.",
          priority: "high",
          actorType: "user",
        },
      ],
    };
  }

  const house = isHouseLikePropertyType(ctx.propertyType);
  const unit = (decl.propertyAddressStructured?.unit ?? "").trim();
  if (house && unit.length > 0) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -8,
      confidence: 0.75,
      details: { mismatch: "house_with_unit", unit },
      signals: [
        {
          signalCode: `${CODE}_house_unit`,
          signalName: "House type with unit field",
          category: "address",
          severity: "medium",
          scoreImpact: -8,
          confidence: 0.75,
          evidence: { propertyType: ctx.propertyType },
          message: "Detached or house-type listings should not carry a unit number unless legally applicable.",
        },
      ],
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: 4,
    confidence: 0.8,
    details: { ok: true },
  };
}
