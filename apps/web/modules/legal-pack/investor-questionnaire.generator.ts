import { LEGAL_PACK_DISCLAIMERS, LEGAL_PACK_VERSION, type QuestionnaireFields } from "./legal-pack.templates";

export function generateInvestorQuestionnaireMarkdown(fields: QuestionnaireFields): string {
  return [
    `# Investor eligibility questionnaire (template v${LEGAL_PACK_VERSION})`,
    "",
    LEGAL_PACK_DISCLAIMERS.notAdvice,
    "",
    "This questionnaire supports exemption documentation only — eligibility must be verified under counsel-approved procedures.",
    "",
    "## Accredited investor",
    fields.accreditedBlock,
    "",
    "## Family, friends & close business associates (FFBA)",
    fields.ffbaBlock,
    "",
    "## Jurisdiction & residency",
    fields.jurisdiction,
    "",
    "## Sophistication / acknowledgement",
    fields.sophisticationAck,
    "",
    "Signature: _________________________  Date: _________",
    "",
  ].join("\n");
}
