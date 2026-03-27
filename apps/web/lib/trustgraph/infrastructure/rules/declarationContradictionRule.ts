import { migrateLegacySellerDeclaration } from "@/lib/fsbo/seller-declaration-schema";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "DECLARATION_CONTRADICTION_RULE";

const ISSUE_KEYWORDS = ["foundation", "water damage", "mold", "infiltration", "structural crack", "major defect"];

/**
 * Deterministic contradiction checks only — conservative (prefer false neutral).
 */
export function evaluateDeclarationContradictionRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const d = migrateLegacySellerDeclaration(ctx.sellerDeclarationJson);
  const known = (d.knownDefects ?? "").trim().toLowerCase();
  const structural = (d.structuralConcerns ?? "").trim().toLowerCase();
  const past = (d.pastIssues ?? "").trim().toLowerCase();

  const claimsNoKnownDefects =
    known === "" || known === "none" || known === "n/a" || known === "no" || known === "nil";

  const structuralSubstantive = structural.length > 12 && !structural.startsWith("none") && !structural.startsWith("n/a");

  if (claimsNoKnownDefects && structuralSubstantive) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -8,
      confidence: 0.65,
      details: { pattern: "no_defects_vs_structural_text" },
      signals: [
        {
          signalCode: `${CODE}_structural_vs_known`,
          signalName: "Possible contradiction in condition fields",
          category: "legal",
          severity: "medium",
          scoreImpact: -8,
          confidence: 0.65,
          evidence: { knownDefects: known.slice(0, 80), structuralConcerns: structural.slice(0, 120) },
          message: "Known defects are empty or “none” but structural concerns describe substantive issues — please review.",
        },
      ],
    };
  }

  const blob = `${d.knownDefects} ${d.pastIssues} ${d.structuralConcerns}`.toLowerCase();
  if (claimsNoKnownDefects && ISSUE_KEYWORDS.some((k) => blob.includes(k))) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -6,
      confidence: 0.55,
      details: { pattern: "keyword_in_condition_fields" },
      signals: [
        {
          signalCode: `${CODE}_keyword`,
          signalName: "Condition text may contradict “no known defects”",
          category: "legal",
          severity: "low",
          scoreImpact: -6,
          confidence: 0.55,
          evidence: {},
          message: "Condition fields mention issues while known defects read as none — verify consistency.",
        },
      ],
    };
  }

  if (d.propertyDescriptionAccurate === true && past.length > 30 && past.includes("unknown")) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 0.5,
      details: { skipped: true },
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: 3,
    confidence: 0.6,
    details: { noContradictionDetected: true },
  };
}
