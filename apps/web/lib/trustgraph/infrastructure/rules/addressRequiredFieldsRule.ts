import { isValidCanadianPostalCode } from "@/lib/fsbo/seller-declaration-validation";
import { migrateLegacySellerDeclaration } from "@/lib/fsbo/seller-declaration-schema";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "ADDRESS_REQUIRED_FIELDS_RULE";

function hasCivicNumber(line: string): boolean {
  const t = line.trim();
  return /^\d+[\s\-]/.test(t) || /^\d+$/.test(t.split(/\s+/)[0] ?? "");
}

export function evaluateAddressRequiredFieldsRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const addr = (ctx.address ?? "").trim();
  const city = (ctx.city ?? "").trim();
  const decl = migrateLegacySellerDeclaration(ctx.sellerDeclarationJson);
  const postal = (decl.propertyAddressStructured?.postalCode ?? "").trim();

  const issues: string[] = [];
  if (addr.length < 6) issues.push("Street address appears incomplete.");
  else if (!hasCivicNumber(addr) && !/[a-zA-Z]/.test(addr)) issues.push("Street address should include a civic number and street name.");

  if (city.length < 2) issues.push("City is required.");

  if (postal && !isValidCanadianPostalCode(postal)) {
    issues.push("Postal code format should be a valid Canadian code when provided.");
  }

  if (issues.length > 0) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -12,
      confidence: 0.9,
      details: { issues, addressLine: addr, city, postalCode: postal || null },
      signals: issues.map((msg, i) => ({
        signalCode: `${CODE}_${i}`,
        signalName: "Address fields incomplete",
        category: "address" as const,
        severity: "high" as const,
        scoreImpact: -12,
        confidence: 0.9,
        evidence: { message: msg },
        message: msg,
      })),
      recommendedActions: [
        {
          actionCode: "COMPLETE_ADDRESS_FIELDS",
          title: "Complete address",
          description: "Add a full civic address, city, and valid postal code in the listing and declaration.",
          priority: "high",
          actorType: "user",
        },
      ],
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: 4,
    confidence: 0.85,
    details: { ok: true },
  };
}
