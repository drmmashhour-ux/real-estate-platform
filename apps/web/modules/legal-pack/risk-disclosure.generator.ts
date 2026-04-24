import { LEGAL_PACK_DISCLAIMERS, LEGAL_PACK_VERSION, type RiskDisclosureFields } from "./legal-pack.templates";

export function generateRiskDisclosureMarkdown(fields: RiskDisclosureFields): string {
  return [
    `# Risk disclosure (template v${LEGAL_PACK_VERSION})`,
    "",
    LEGAL_PACK_DISCLAIMERS.notAdvice,
    "",
    LEGAL_PACK_DISCLAIMERS.noGuarantee,
    "",
    "## Illiquidity",
    fields.illiquidity,
    "",
    "## Loss of capital",
    fields.lossOfCapital,
    "",
    "## Execution risk",
    fields.executionRisk,
    "",
    "## Financing risk",
    fields.financingRisk,
    "",
    "## Market risk",
    fields.marketRisk,
    "",
    "## Construction / retrofit risk",
    fields.constructionRetrofitRisk,
    "",
    "## Regulatory risk",
    fields.regulatoryRisk,
    "",
  ].join("\n");
}
