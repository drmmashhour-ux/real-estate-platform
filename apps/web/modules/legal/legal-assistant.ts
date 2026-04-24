/**
 * Draft document assembly — templates + optional clauses. Does not provide legal advice.
 */
import {
  generateCancellationClause,
  generateCancellationOutline,
  generateLiabilityClause,
  generatePaymentTermsClause,
} from "./clause.generator";
import { LEGAL_ASSISTANT_DISCLAIMER } from "./legal-disclaimer";
import type { GeneratedLegalDocument, LegalDocumentContext } from "./legal-assistant.types";
import { getLegalTemplate } from "./templates";

export { LEGAL_ASSISTANT_DISCLAIMER } from "./legal-disclaimer";

const EXTENDED_NOTICE =
  "This draft is for editing only. It may be incomplete, may omit mandatory disclosures or local forms, and must be reviewed by qualified legal counsel before use. The platform does not warrant accuracy or fitness for a particular jurisdiction.";

/** Apply `{{KEY}}` replacements; unknown keys stay as-is. */
export function applyLegalPlaceholders(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : `{{${key}}}`
  );
}

function partyByRole(parties: LegalDocumentContext["parties"], roleMatch: RegExp): string {
  const p = parties?.find((x) => roleMatch.test(x.role.trim().toLowerCase()));
  return p?.legalName?.trim() || "";
}

function buildPlaceholderMap(ctx: LegalDocumentContext): Record<string, string> {
  const { property, parties, dates, terms } = ctx;
  const t = terms ?? {};

  const host =
    partyByRole(parties, /host|owner|landlord/) ||
    partyByRole(parties, /lessor/) ||
    "[Host legal name — complete]";
  const guest =
    partyByRole(parties, /guest|tenant|renter|lessee/) ||
    "[Guest legal name — complete]";
  const landlord = partyByRole(parties, /landlord|lessor|owner/) || host;
  const tenant = partyByRole(parties, /tenant|renter|lessee/) || guest;
  const broker =
    partyByRole(parties, /broker|agent|agency/) ||
    "[Broker legal name — complete]";

  const propLine = [property?.address, property?.unit].filter(Boolean).join(", ") || "[Property address — complete]";
  const cityLine =
    [property?.city, property?.region, property?.country].filter(Boolean).join(", ") ||
    "[City / region — complete]";

  const gov =
    t.governingLawNote?.trim() ||
    "To be specified by the parties before signing (the platform does not select governing law).";

  const cur = t.currency?.trim() || "";
  const currency = cur || "[currency]";

  return {
    HOST_LEGAL_NAME: host,
    GUEST_LEGAL_NAME: guest,
    LANDLORD_LEGAL_NAME: landlord,
    TENANT_LEGAL_NAME: tenant,
    BROKER_LEGAL_NAME: broker,
    PROPERTY_ADDRESS: propLine,
    PROPERTY_CITY: cityLine,
    LISTING_OR_PROPERTY_LABEL: property?.label?.trim() || propLine,
    EFFECTIVE_DATE: dates?.effectiveDate?.trim() || "[Effective date — complete]",
    CHECK_IN_DATE: dates?.checkIn?.trim() || "[Check-in — complete]",
    CHECK_OUT_DATE: dates?.checkOut?.trim() || "[Check-out — complete]",
    LEASE_START_DATE: dates?.leaseStart?.trim() || "[Lease start — complete]",
    LEASE_END_DATE: dates?.leaseEnd?.trim() || "[Lease end — complete]",
    TERM_END_DATE: dates?.termEnd?.trim() || "[Term / renewal — complete]",
    POLICY_EFFECTIVE_DATE: dates?.policyEffective?.trim() || dates?.effectiveDate?.trim() || "[Policy effective date — complete]",
    TOTAL_PRICE: t.totalAmount?.trim() || "[Total — complete]",
    DEPOSIT_AMOUNT: t.depositAmount?.trim() || "[Deposit — complete]",
    RENT_AMOUNT: t.rentAmount?.trim() || "[Rent — complete]",
    SECURITY_DEPOSIT: t.securityDeposit?.trim() || "[Security deposit — complete]",
    PAYMENT_DUE_DAY: t.paymentDueDay?.trim() || "[Payment due — complete]",
    CURRENCY: currency,
    BROKER_LICENSE_INFO: t.brokerLicenseInfo?.trim() || "[License / registration — complete or N/A]",
    PLATFORM_ENTITY_NAME: t.platformEntityName?.trim() || "[Platform legal entity — complete]",
    SCOPE_SUMMARY:
      t.scopeSummary?.trim() ||
      "[Describe scope: leads, territories, listing types — complete before signing.]",
    COMPENSATION_SUMMARY:
      t.compensationSummary?.trim() ||
      "[Describe fee splits, retainers, or referral fees — complete with finance and counsel.]",
    REFUND_RULES_SUMMARY:
      t.refundRulesSummary?.trim() ||
      "[Describe refund tiers and deadlines — complete before publishing.]",
    FORCE_MAJEURE_NOTE:
      t.forceMajeureNote?.trim() ||
      "[Describe how cancellations work for severe weather, travel bans, etc. — complete.]",
    GOVERNING_LAW_NOTE: gov,
  };
}

function extractUnresolvedKeys(text: string): string[] {
  const keys = new Set<string>();
  const re = /\{\{([A-Z0-9_]+)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) keys.add(m[1]);
  return [...keys].sort();
}

/**
 * Assembles a single markdown document from a template, user fields, and optional clause blocks.
 */
export function generateDocument(context: LegalDocumentContext): GeneratedLegalDocument {
  const def = getLegalTemplate(context.documentType);
  if (!def) {
    throw new Error(`Unknown document type: ${context.documentType}`);
  }

  const vars = buildPlaceholderMap(context);
  let body = applyLegalPlaceholders(def.body, vars);

  const c = context.clauses ?? {};
  const extra: string[] = [];

  if (c.includeCancellation !== false && context.documentType !== "cancellation_policy") {
    extra.push(
      generateCancellationClause(context.terms?.cancellationStrictness ?? "moderate")
    );
  }
  if (c.includePaymentTerms === true) {
    extra.push(
      generatePaymentTermsClause({
        currency: context.terms?.currency,
        totalAmountLabel: context.terms?.totalAmount,
        depositLabel: context.terms?.depositAmount,
        balanceDueTiming: context.terms?.paymentDueDay,
      })
    );
  }
  if (c.includeLiability === true) {
    extra.push(generateLiabilityClause({ partyIntentNote: context.terms?.liabilityIntentNote }));
  }

  const sections = [
    `> **${LEGAL_ASSISTANT_DISCLAIMER}**`,
    "",
    `> ${EXTENDED_NOTICE}`,
    "",
    `# ${def.title}`,
    "",
    body.trimEnd(),
  ];

  if (extra.length) {
    sections.push("", "## Additional draft clauses (editable)", "", extra.join("\n"));
  }

  sections.push(
    "",
    "---",
    "",
    `**${LEGAL_ASSISTANT_DISCLAIMER}**`,
    "",
    EXTENDED_NOTICE
  );

  const fullDocument = sections.join("\n");
  const unresolvedPlaceholderKeys = extractUnresolvedKeys(fullDocument);
  const hasUnresolvedPlaceholders = unresolvedPlaceholderKeys.length > 0;

  return {
    documentType: context.documentType,
    title: def.title,
    fullDocument,
    editableFormat: "markdown",
    disclaimer: LEGAL_ASSISTANT_DISCLAIMER,
    hasUnresolvedPlaceholders,
    unresolvedPlaceholderKeys,
    notLegalAdvice: true,
  };
}
