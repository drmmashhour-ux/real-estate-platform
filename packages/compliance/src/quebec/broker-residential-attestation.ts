import type { LanguagePolicy } from "@/lib/compliance/quebec/language-policy";
import { DEFAULT_QUEBEC_LANGUAGE_POLICY } from "@/lib/compliance/quebec/language-policy";
import { QC_RESIDENTIAL_CONTRACT_TERMS_FR } from "@/lib/compliance/quebec/contract-language-defaults";

export type BrokerLicenceAttestationInput = {
  displayName: string;
  licenceNumber: string | null;
  /** Normalized to residential for LECIPM product scope. */
  licenceType: string | null;
  gst?: string | null;
  qst?: string | null;
};

/** Phrases implying commercial brokerage or out-of-scope practice (heuristic block list). */
const COMMERCIAL_BROKERAGE_RE =
  /\b(commercial\s+broker|commercial\s+real\s+estate\s+broker|courtier\s+immobilier\s+commercial|courtier\s+commercial|industrial\s+broker|broker\s*\/\s*commercial)\b/i;

const COMMERCIAL_SCOPE_HINT_RE =
  /\b(office\s+tower\s+investment|retail\s+portfolio|industrial\s+warehouse\s+brokerage|triple\s*[- ]?net\s+lease\s+broker)\b/i;

export const RESIDENTIAL_BROKER_TITLE_FR = QC_RESIDENTIAL_CONTRACT_TERMS_FR.brokerResidential;

export function scanResidentialScopeViolations(text: string): string[] {
  const violations: string[] = [];
  if (!text || !text.trim()) return violations;
  if (COMMERCIAL_BROKERAGE_RE.test(text)) {
    violations.push("Text references commercial brokerage — outside residential licence scope.");
  }
  if (COMMERCIAL_SCOPE_HINT_RE.test(text)) {
    violations.push("Text implies non-residential brokerage positioning.");
  }
  return violations;
}

export function assertResidentialLicenceType(licenceType: string | null | undefined): {
  ok: boolean;
  violation?: string;
} {
  const t = (licenceType ?? "residential").trim().toLowerCase();
  if (t === "residential" || t === "résidentiel" || t === "residentiel") {
    return { ok: true };
  }
  return {
    ok: false,
    violation: "Broker licence type must be residential for this product scope.",
  };
}

/** Public footer block — emails, chat signatures, invoices (FR-first lines, EN reference optional). */
export function formatResidentialBrokerSignatureBlock(
  broker: BrokerLicenceAttestationInput,
  policy: LanguagePolicy = DEFAULT_QUEBEC_LANGUAGE_POLICY,
): { french: string; english: string } {
  const name = broker.displayName.trim();
  const num = broker.licenceNumber?.trim();
  const oaciqLineFr = num ? `OACIQ : ${num}` : "OACIQ : (numéro de permis requis)";
  const oaciqLineEn = num ? `OACIQ: ${num}` : "OACIQ: (licence number required)";

  const taxFr = [broker.gst?.trim() ? `TPS : ${broker.gst}` : null, broker.qst?.trim() ? `TVQ : ${broker.qst}` : null]
    .filter(Boolean)
    .join(" · ");
  const taxEn = [broker.gst?.trim() ? `GST: ${broker.gst}` : null, broker.qst?.trim() ? `QST: ${broker.qst}` : null]
    .filter(Boolean)
    .join(" · ");

  const french = [
    name,
    RESIDENTIAL_BROKER_TITLE_FR,
    oaciqLineFr,
    taxFr || null,
  ]
    .filter(Boolean)
    .join("\n");

  const english =
    policy.supportedLanguages.includes("EN") && policy.defaultLanguage === "FR"
      ? [name, "Residential real estate broker", oaciqLineEn, taxEn || null].filter(Boolean).join("\n")
      : french;

  return { french, english };
}

export function formatBilingualEmailFooter(broker: BrokerLicenceAttestationInput): string {
  const { french, english } = formatResidentialBrokerSignatureBlock(broker);
  return `${french}\n---\n${english}`;
}
