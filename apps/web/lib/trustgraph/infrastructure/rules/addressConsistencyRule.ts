import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import type { FsboListingRuleContext } from "@/lib/trustgraph/domain/types";
import { validateStructuredAddressVsPropertyType } from "@/lib/fsbo/seller-declaration-validation";
import { migrateLegacySellerDeclaration } from "@/lib/fsbo/seller-declaration-schema";

const CODE = "address_consistency";
const VERSION = "1";

export function evaluateAddressConsistencyRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const decl = migrateLegacySellerDeclaration(ctx.sellerDeclarationJson);
  const structured = decl.propertyAddressStructured;
  const vs = validateStructuredAddressVsPropertyType(ctx.propertyType, {
    street: structured.street ?? "",
    unit: structured.unit ?? "",
    city: structured.city ?? "",
    postalCode: structured.postalCode ?? "",
  });

  const errors = vs.errors ?? [];
  const warnings = vs.warnings ?? [];

  if (errors.length > 0) {
    return {
      ruleCode: CODE,
      ruleVersion: VERSION,
      passed: false,
      scoreDelta: -15,
      confidence: 0.95,
      details: { errors, warnings },
      signals: errors.map((msg, i) => ({
        signalCode: `${CODE}_error_${i}`,
        signalName: "Address / property type inconsistency",
        category: "address" as const,
        severity: "high" as const,
        scoreImpact: -15,
        confidence: 0.95,
        evidence: { message: msg, propertyType: ctx.propertyType },
        message: msg,
      })),
      recommendedActions: [
        {
          actionCode: "fix_structured_address",
          title: "Fix structured address",
          description: "Align street, unit, city, and postal code with the selected property type.",
          priority: "high" as const,
          actorType: "user" as const,
        },
      ],
    };
  }

  if (warnings.length > 0) {
    return {
      ruleCode: CODE,
      ruleVersion: VERSION,
      passed: true,
      scoreDelta: -3,
      confidence: 0.7,
      details: { warnings },
      signals: warnings.map((msg, i) => ({
        signalCode: `${CODE}_warn_${i}`,
        signalName: "Address verification suggestion",
        category: "address" as const,
        severity: "medium" as const,
        scoreImpact: -3,
        confidence: 0.7,
        evidence: { message: msg },
        message: msg,
      })),
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: VERSION,
    passed: true,
    scoreDelta: 5,
    confidence: 0.85,
    details: { ok: true },
  };
}
