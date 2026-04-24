import { LEGAL_PACK_DISCLAIMERS, LEGAL_PACK_VERSION, type ExemptionRepresentationFields } from "./legal-pack.templates";

export function generateExemptionRepresentationMarkdown(fields: ExemptionRepresentationFields): string {
  return [
    `# Exemption representation letter (template v${LEGAL_PACK_VERSION})`,
    "",
    LEGAL_PACK_DISCLAIMERS.notAdvice,
    "",
    LEGAL_PACK_DISCLAIMERS.privatePlacement,
    "",
    `## Exemption relied upon`,
    String(fields.exemptionReliedUpon),
    "",
    "## Investor confirms qualification",
    fields.qualificationConfirm,
    "",
    "## Independent decision",
    fields.independentDecisionConfirm,
    "",
    "Signature: _________________________  Date: _________",
    "",
  ].join("\n");
}
