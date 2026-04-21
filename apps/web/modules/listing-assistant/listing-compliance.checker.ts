import type { ComplianceCheckResult } from "@/modules/listing-assistant/listing-assistant.types";

const RISK_PHRASES_HIGH: RegExp[] = [
  /\bguaranteed\s+(return|roi|rent|income)\b/i,
  /\bno\s+risk\b/i,
  /\bmust\s+appreciate\b/i,
  /\bfixed\s+return\b/i,
  /\bcan't\s+lose\b/i,
  /garanti(e)?\s+(revenu|rendement|location)\b/i,
  /sans\s+risque\b/i,
  /ضمان\s+(العائد|الدخل|الربح)/i,
  /لا\s+مخاطر|بدون\s+مخاطر/i,
];

const RISK_PHRASES_MEDIUM: RegExp[] = [
  /\bguaranteed\b/i,
  /\bbest\s+investment\b/i,
  /\bprime\s+location\b(?!\s*—)/i,
  /\bhuge\s+profit\b/i,
  /\bgovernment\s+approved\b/i,
  /\bapproved\s+funding\b/i,
];

/** Misrepresentation / omission signals — align with brokerage advertising norms (non-exhaustive). */
export function checkListingCompliance(textFields: {
  title?: string;
  description?: string;
  highlights?: string[];
}): ComplianceCheckResult {
  const blob = [
    textFields.title ?? "",
    textFields.description ?? "",
    ...(textFields.highlights ?? []),
  ].join("\n");

  const warnings: string[] = [];

  for (const rx of RISK_PHRASES_HIGH) {
    if (rx.test(blob)) warnings.push(`High-risk phrasing detected (${rx.source.slice(0, 40)}…) — replace with factual, verifiable wording.`);
  }
  for (const rx of RISK_PHRASES_MEDIUM) {
    if (rx.test(blob)) warnings.push(`Review superlative / guarantee-like language (${rx.source.slice(0, 36)}…) — soften or substantiate.`);
  }

  if (
    blob.length > 20 &&
    !/\bverify|vérification|estimation|estimate|يُتحقق|تقدير|\bsubject to\b|soumis|document(ation)?/i.test(blob)
  ) {
    warnings.push("Consider adding explicit diligence language (subject to verification, estimates only).");
  }

  let riskLevel: ComplianceCheckResult["riskLevel"] = "LOW";
  if (warnings.length >= 3) riskLevel = "HIGH";
  else if (warnings.length >= 1) riskLevel = "MEDIUM";

  /** HIGH textual risk → not compliant for publish without edits; MEDIUM requires broker review. */
  const compliant = riskLevel === "LOW";

  return {
    compliant,
    warnings,
    riskLevel,
  };
}
