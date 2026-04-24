import type { LecipmLegalDocumentDomain, LecipmLegalDocumentTemplateKind } from "@prisma/client";

export function domainForTemplateKind(kind: LecipmLegalDocumentTemplateKind): LecipmLegalDocumentDomain {
  switch (kind) {
    case "PROMISE_TO_PURCHASE":
    case "COUNTER_PROPOSAL":
    case "AMENDMENT":
    case "BROKER_DISCLOSURE":
    case "CONFLICT_DISCLOSURE":
      return "BROKERAGE";
    case "SUBSCRIPTION_AGREEMENT":
    case "INVESTOR_MEMO":
    case "RISK_DISCLOSURE":
    case "EXEMPTION_REPRESENTATION":
    case "INVESTOR_QUESTIONNAIRE":
      return "INVESTMENT";
    case "DEAL_INVESTOR_HANDOFF_PACKET":
      return "INTERNAL_HANDOFF";
    default:
      return "BROKERAGE";
  }
}

export function investmentComplianceStrict(): boolean {
  return process.env.LECIPM_INVESTMENT_LEGAL_DOC_COMPLIANCE_STRICT === "1" || process.env.LECIPM_INVESTMENT_LEGAL_DOC_COMPLIANCE_STRICT === "true";
}

export function legalDocumentsEngineEnabled(): boolean {
  if (process.env.LECIPM_LEGAL_DOCUMENTS_ENGINE === "0" || process.env.LECIPM_LEGAL_DOCUMENTS_ENGINE === "false") {
    return false;
  }
  return true;
}
