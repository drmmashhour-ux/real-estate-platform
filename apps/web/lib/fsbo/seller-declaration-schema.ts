import { isIdentityDeclarationCompleteForUi } from "@/lib/fsbo/seller-declaration-validation";

/**
 * Structured seller declaration for FSBO Seller Hub (transparency checklist).
 * This is not the official OACIQ “Declarations by the seller” (DS) or divided co-ownership (DSD) form annexed to
 * brokerage contracts; those are completed with a licensee when brokerage applies.
 * Stored in `FsboListing.sellerDeclarationJson` with `version: 3`.
 */

export const SELLER_DECLARATION_VERSION = 3 as const;
/** Legacy v2 — still migrated on read */
export const SELLER_DECLARATION_VERSION_LEGACY = 2 as const;

export type IdDocumentType = "PASSPORT" | "DRIVERS_LICENSE" | "NATIONAL_ID" | "OTHER";

export type IdVerificationStatus = "none" | "pending" | "verified";

export type PartyIdentity = {
  id: string;
  idType: IdDocumentType | "";
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
  occupation: string;
  annualIncome: string;
  phone: string;
  email: string;
  /** True when this seller intentionally shares phone/email with another seller (after confirmation). */
  sharedContact: boolean;
  idDocumentUrl: string | null;
  idDocumentVerificationStatus: IdVerificationStatus;
};

/** Property address as declared by the seller (must align with listing property type where applicable). */
export type StructuredPropertyAddress = {
  street: string;
  unit: string;
  city: string;
  postalCode: string;
};

export type SellerDeclarationData = {
  version: typeof SELLER_DECLARATION_VERSION;
  /** Structured identity — at least one seller required for completion */
  sellers: PartyIdentity[];
  /** Optional known buyers (e.g. conflict-of-interest context); each entry must be complete if present */
  buyers: PartyIdentity[];

  /** Structured civic address (must match property type rules; synced to listing address fields on save). */
  propertyAddressStructured: StructuredPropertyAddress;
  /**
   * Required when any seller uses the same phone or email as another seller intentionally (`sharedContact`).
   * Confirms accuracy of shared contact information.
   */
  sharedContactResponsibilityConfirmed: boolean;

  /** 1 — Seller identity & authority (narrative) */
  sellerFullName: string;
  hasAuthorityToSell: boolean;
  identityNotes: string;

  /** 2 — Conflict of interest */
  sellingToFamilyMember: boolean;
  relatedToBuyer: boolean;
  conflictInterestDisclosureConfirmed: boolean;

  /** 3 — Property description (seller attestation) */
  propertyDescriptionAccurate: boolean;
  propertyDescriptionNotes: string;

  /** 4 — Inclusions / exclusions */
  includedItems: string;
  excludedItems: string;

  /** 5 — Property condition */
  knownDefects: string;
  pastIssues: string;
  structuralConcerns: string;

  /** 6 — Renovations */
  renovationsDetail: string;
  renovationInvoicesAvailable: boolean | null;

  /**
   * 7 — Swimming pool
   * `null` = seller has not answered yet (section NOT_STARTED — avoids fake “complete”).
   */
  poolExists: boolean | null;
  poolType: string;
  poolSafetyCompliance: string;

  /** 8 — Inspection */
  buyerInspectionAccepted: boolean;

  /** 9 — Condo / syndicate (if applicable) */
  isCondo: boolean;
  condoSyndicateDocumentsAvailable: boolean;
  condoFinancialStatementsAvailable: boolean;
  condoRulesReviewed: boolean;

  /** 10 — New construction / GCR */
  isNewConstruction: boolean;
  gcrWarrantyDetails: string;
  builderNameContact: string;

  /** 11 — Taxes & costs */
  municipalSchoolTaxAcknowledged: boolean;
  gstQstMayApply: boolean;
  gstQstNotes: string;

  /**
   * 12 — Details & additional declarations (DS/DSD-style clarifications; clause D15–type content).
   * `additionalDeclarationsHistory` is append-only; each save adds an entry (AM-style updates).
   */
  additionalDeclarationsText: string;
  additionalDeclarationsInsufficientKnowledge: boolean;
  additionalDeclarationsRelatedSectionKeys: string[];
  additionalDeclarationsAttachedDocumentIds: string[];
  additionalDeclarationsLegalAck: boolean;
  additionalDeclarationsHistory: AdditionalDeclarationHistoryEntry[];

  /** 13 — Final legal */
  informationCompleteAndAccurate: boolean;
  platformNotLawyerOrInspectorAck: boolean;
};

/** One saved “additional declarations” snapshot (timestamped; do not overwrite prior rows). */
export type AdditionalDeclarationHistoryEntry = {
  id: string;
  createdAt: string;
  text: string;
  insufficientKnowledge: boolean;
  relatedSectionKeys: string[];
  attachedDocumentIds: string[];
  legalAck: boolean;
};

function newPartyId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `party-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function newAdditionalDeclarationEntryId(): string {
  return newPartyId();
}

function normalizeAdditionalHistoryEntry(raw: unknown): AdditionalDeclarationHistoryEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    id: typeof o.id === "string" && o.id ? o.id : newAdditionalDeclarationEntryId(),
    createdAt: typeof o.createdAt === "string" && o.createdAt ? o.createdAt : new Date().toISOString(),
    text: typeof o.text === "string" ? o.text : "",
    insufficientKnowledge: Boolean(o.insufficientKnowledge),
    relatedSectionKeys: Array.isArray(o.relatedSectionKeys)
      ? o.relatedSectionKeys.filter((x): x is string => typeof x === "string")
      : [],
    attachedDocumentIds: Array.isArray(o.attachedDocumentIds)
      ? o.attachedDocumentIds.filter((x): x is string => typeof x === "string")
      : [],
    legalAck: Boolean(o.legalAck),
  };
}

export function emptyParty(): PartyIdentity {
  return {
    id: newPartyId(),
    idType: "",
    idNumber: "",
    fullName: "",
    dateOfBirth: "",
    occupation: "",
    annualIncome: "",
    phone: "",
    email: "",
    sharedContact: false,
    idDocumentUrl: null,
    idDocumentVerificationStatus: "none",
  };
}

export function emptyStructuredAddress(): StructuredPropertyAddress {
  return { street: "", unit: "", city: "", postalCode: "" };
}

export function emptySellerDeclaration(): SellerDeclarationData {
  return {
    version: SELLER_DECLARATION_VERSION,
    sellers: [emptyParty()],
    buyers: [],
    propertyAddressStructured: emptyStructuredAddress(),
    sharedContactResponsibilityConfirmed: false,
    sellerFullName: "",
    hasAuthorityToSell: false,
    identityNotes: "",
    sellingToFamilyMember: false,
    relatedToBuyer: false,
    conflictInterestDisclosureConfirmed: false,
    propertyDescriptionAccurate: false,
    propertyDescriptionNotes: "",
    includedItems: "",
    excludedItems: "",
    knownDefects: "",
    pastIssues: "",
    structuralConcerns: "",
    renovationsDetail: "",
    renovationInvoicesAvailable: null,
    poolExists: null,
    poolType: "",
    poolSafetyCompliance: "",
    buyerInspectionAccepted: false,
    isCondo: false,
    condoSyndicateDocumentsAvailable: false,
    condoFinancialStatementsAvailable: false,
    condoRulesReviewed: false,
    isNewConstruction: false,
    gcrWarrantyDetails: "",
    builderNameContact: "",
    municipalSchoolTaxAcknowledged: false,
    gstQstMayApply: false,
    gstQstNotes: "",
    additionalDeclarationsText: "",
    additionalDeclarationsInsufficientKnowledge: false,
    additionalDeclarationsRelatedSectionKeys: [],
    additionalDeclarationsAttachedDocumentIds: [],
    additionalDeclarationsLegalAck: false,
    additionalDeclarationsHistory: [],
    informationCompleteAndAccurate: false,
    platformNotLawyerOrInspectorAck: false,
  };
}

function nonEmpty(s: unknown, min = 2): boolean {
  return typeof s === "string" && s.trim().length >= min;
}

export function isPartyIdentityComplete(p: PartyIdentity): boolean {
  return (
    p.idType !== "" &&
    nonEmpty(p.idNumber) &&
    nonEmpty(p.fullName) &&
    nonEmpty(p.dateOfBirth) &&
    nonEmpty(p.occupation) &&
    nonEmpty(p.annualIncome) &&
    nonEmpty(p.phone) &&
    nonEmpty(p.email) &&
    Boolean(p.idDocumentUrl?.trim())
  );
}

function partyIdentityStarted(p: PartyIdentity): boolean {
  return (
    p.idType !== "" ||
    nonEmpty(p.idNumber, 1) ||
    nonEmpty(p.fullName, 1) ||
    nonEmpty(p.dateOfBirth, 1) ||
    nonEmpty(p.occupation, 1) ||
    nonEmpty(p.annualIncome, 1) ||
    nonEmpty(p.phone, 1) ||
    nonEmpty(p.email, 1) ||
    Boolean(p.idDocumentUrl?.trim())
  );
}

/** Full declaration “identity” gate including optional buyers (publish / mark complete). */
export function isIdentityDeclarationComplete(
  d: Partial<SellerDeclarationData>,
  propertyType?: string | null
): boolean {
  const buyers = d.buyers ?? [];
  if (buyers.length > 0 && !buyers.every((b) => isPartyIdentityComplete(b))) return false;
  return isIdentityDeclarationCompleteForUi(d, propertyType ?? "");
}

function identitySectionStarted(d: Partial<SellerDeclarationData>): boolean {
  const sellers = d.sellers ?? [];
  const buyers = d.buyers ?? [];
  const pa = d.propertyAddressStructured;
  if (
    pa &&
    (nonEmpty(pa.street, 1) || nonEmpty(pa.city, 1) || nonEmpty(pa.postalCode, 1) || nonEmpty(pa.unit, 1))
  ) {
    return true;
  }
  return (
    sellers.some((s) => partyIdentityStarted(s)) ||
    buyers.some((b) => partyIdentityStarted(b)) ||
    Boolean(d.hasAuthorityToSell) ||
    nonEmpty(d.identityNotes, 1)
  );
}

function poolFieldsComplete(d: Partial<SellerDeclarationData>): boolean {
  if (d.poolExists === null) return false;
  if (d.poolExists === false) return true;
  return nonEmpty(d.poolType) && nonEmpty(d.poolSafetyCompliance);
}

function poolSectionStarted(d: Partial<SellerDeclarationData>): boolean {
  return d.poolExists !== null;
}

/** Section ids for checklist UI */
export const DECLARATION_SECTION_IDS = [
  "identity",
  "conflict",
  "description",
  "inclusions",
  "condition",
  "renovations",
  "pool",
  "inspection",
  "condo",
  "newConstruction",
  "taxes",
  "additionalDeclarations",
  "final",
] as const;

export type DeclarationSectionId = (typeof DECLARATION_SECTION_IDS)[number];

/** Legacy — kept for any external imports */
export type SectionStatus = "complete" | "incomplete" | "na";

export type DeclarationUiStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "NA";

function toUi(
  complete: boolean,
  started: boolean,
  na?: boolean
): DeclarationUiStatus {
  if (na) return "NA";
  if (complete) return "COMPLETED";
  if (started) return "IN_PROGRESS";
  return "NOT_STARTED";
}

export function getSellerDeclarationSectionUiStatus(
  d: Partial<SellerDeclarationData>,
  propertyType?: string | null
): Record<DeclarationSectionId, DeclarationUiStatus> {
  const condoOk =
    !d.isCondo ||
    Boolean(
      d.condoSyndicateDocumentsAvailable &&
        d.condoFinancialStatementsAvailable &&
        d.condoRulesReviewed
    );
  const newOk =
    !d.isNewConstruction || (nonEmpty(d.gcrWarrantyDetails) && nonEmpty(d.builderNameContact));

  return {
    identity: toUi(isIdentityDeclarationCompleteForUi(d, propertyType ?? ""), identitySectionStarted(d)),
    conflict: toUi(
      Boolean(d.conflictInterestDisclosureConfirmed),
      Boolean(d.sellingToFamilyMember || d.relatedToBuyer || d.conflictInterestDisclosureConfirmed)
    ),
    description: toUi(
      Boolean(d.propertyDescriptionAccurate) && nonEmpty(d.propertyDescriptionNotes, 10),
      Boolean(d.propertyDescriptionAccurate) || nonEmpty(d.propertyDescriptionNotes, 1)
    ),
    inclusions: toUi(
      nonEmpty(d.includedItems) && nonEmpty(d.excludedItems),
      nonEmpty(d.includedItems, 1) || nonEmpty(d.excludedItems, 1)
    ),
    condition: toUi(
      nonEmpty(d.knownDefects) && nonEmpty(d.pastIssues) && nonEmpty(d.structuralConcerns),
      nonEmpty(d.knownDefects, 1) || nonEmpty(d.pastIssues, 1) || nonEmpty(d.structuralConcerns, 1)
    ),
    renovations: toUi(
      nonEmpty(d.renovationsDetail) && d.renovationInvoicesAvailable !== null,
      nonEmpty(d.renovationsDetail, 1) || d.renovationInvoicesAvailable !== null
    ),
    pool: toUi(poolFieldsComplete(d), poolSectionStarted(d)),
    inspection: toUi(Boolean(d.buyerInspectionAccepted), Boolean(d.buyerInspectionAccepted)),
    condo: toUi(condoOk, Boolean(d.isCondo), !d.isCondo),
    newConstruction: toUi(newOk, Boolean(d.isNewConstruction), !d.isNewConstruction),
    taxes: toUi(
      Boolean(d.municipalSchoolTaxAcknowledged),
      Boolean(d.municipalSchoolTaxAcknowledged) || Boolean(d.gstQstMayApply) || nonEmpty(d.gstQstNotes, 1)
    ),
    additionalDeclarations: toUi(
      isAdditionalDeclarationsSectionComplete(d),
      additionalDeclarationsSectionStarted(d)
    ),
    final: toUi(
      Boolean(d.informationCompleteAndAccurate && d.platformNotLawyerOrInspectorAck),
      Boolean(d.informationCompleteAndAccurate || d.platformNotLawyerOrInspectorAck)
    ),
  };
}

/** @deprecated Prefer getSellerDeclarationSectionUiStatus */
export function getSellerDeclarationSectionStatus(
  d: Partial<SellerDeclarationData>,
  propertyType?: string | null
): Record<DeclarationSectionId, SectionStatus> {
  const ui = getSellerDeclarationSectionUiStatus(d, propertyType);
  const out = {} as Record<DeclarationSectionId, SectionStatus>;
  for (const id of DECLARATION_SECTION_IDS) {
    const u = ui[id];
    if (u === "NA") out[id] = "na";
    else out[id] = u === "COMPLETED" ? "complete" : "incomplete";
  }
  return out;
}

export function declarationCompletionPercent(
  d: Partial<SellerDeclarationData>,
  propertyType?: string | null
): number {
  const ui = getSellerDeclarationSectionUiStatus(d, propertyType);
  let done = 0;
  let total = 0;
  for (const id of DECLARATION_SECTION_IDS) {
    if (ui[id] === "NA") continue;
    total += 1;
    if (ui[id] === "COMPLETED") done += 1;
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

/** True when the latest history entry meets text + legal rules (D15-style). */
export function isAdditionalDeclarationHistoryEntryComplete(e: AdditionalDeclarationHistoryEntry): boolean {
  if (!e.legalAck) return false;
  const text = e.text?.trim() ?? "";
  if (e.insufficientKnowledge) {
    return text.length >= 20;
  }
  return text.length >= 10;
}

/** Section is complete only after at least one valid, timestamped entry exists. */
export function isAdditionalDeclarationsSectionComplete(d: Partial<SellerDeclarationData>): boolean {
  const h = d.additionalDeclarationsHistory;
  if (!Array.isArray(h) || h.length === 0) return false;
  const last = h[h.length - 1];
  return isAdditionalDeclarationHistoryEntryComplete(last);
}

function additionalDeclarationsSectionStarted(d: Partial<SellerDeclarationData>): boolean {
  if (isAdditionalDeclarationsSectionComplete(d)) return true;
  const h = d.additionalDeclarationsHistory;
  if (Array.isArray(h) && h.length > 0) return true;
  if (nonEmpty(d.additionalDeclarationsText, 1)) return true;
  if (d.additionalDeclarationsInsufficientKnowledge) return true;
  if (d.additionalDeclarationsLegalAck) return true;
  if (Array.isArray(d.additionalDeclarationsRelatedSectionKeys) && d.additionalDeclarationsRelatedSectionKeys.length > 0) {
    return true;
  }
  if (Array.isArray(d.additionalDeclarationsAttachedDocumentIds) && d.additionalDeclarationsAttachedDocumentIds.length > 0) {
    return true;
  }
  return false;
}

export function declarationSectionCounts(
  d: Partial<SellerDeclarationData>,
  propertyType?: string | null
): { completed: number; total: number } {
  const ui = getSellerDeclarationSectionUiStatus(d, propertyType);
  let completed = 0;
  let total = 0;
  for (const id of DECLARATION_SECTION_IDS) {
    if (ui[id] === "NA") continue;
    total += 1;
    if (ui[id] === "COMPLETED") completed += 1;
  }
  return { completed, total };
}

export function missingDeclarationSections(
  d: Partial<SellerDeclarationData>,
  propertyType?: string | null
): DeclarationSectionId[] {
  const ui = getSellerDeclarationSectionUiStatus(d, propertyType);
  return DECLARATION_SECTION_IDS.filter((id) => ui[id] === "IN_PROGRESS" || ui[id] === "NOT_STARTED");
}

/** Merge legacy 6-field JSON or v2 into v3 shape for editing */
export function migrateLegacySellerDeclaration(raw: unknown): SellerDeclarationData {
  const base = emptySellerDeclaration();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;

  if (o.version === SELLER_DECLARATION_VERSION) {
    const v3 = o as unknown as SellerDeclarationData;
    const sellers =
      Array.isArray(v3.sellers) && v3.sellers.length > 0
        ? v3.sellers.map((s) => ({
            ...emptyParty(),
            ...s,
            id: s.id || newPartyId(),
            sharedContact: Boolean((s as PartyIdentity).sharedContact),
          }))
        : [emptyParty()];
    const buyers = Array.isArray(v3.buyers)
      ? v3.buyers.map((b) => ({
          ...emptyParty(),
          ...b,
          id: b.id || newPartyId(),
          sharedContact: Boolean((b as PartyIdentity).sharedContact),
        }))
      : [];
    const hist = Array.isArray(v3.additionalDeclarationsHistory)
      ? v3.additionalDeclarationsHistory
          .map(normalizeAdditionalHistoryEntry)
          .filter((e): e is AdditionalDeclarationHistoryEntry => e !== null)
      : [];
    const pa = (v3 as Partial<SellerDeclarationData>).propertyAddressStructured;
    const propertyAddressStructured: StructuredPropertyAddress =
      pa && typeof pa === "object"
        ? {
            street: typeof pa.street === "string" ? pa.street : "",
            unit: typeof pa.unit === "string" ? pa.unit : "",
            city: typeof pa.city === "string" ? pa.city : "",
            postalCode: typeof pa.postalCode === "string" ? pa.postalCode : "",
          }
        : emptyStructuredAddress();
    return {
      ...base,
      ...v3,
      version: SELLER_DECLARATION_VERSION,
      sellers,
      buyers,
      propertyAddressStructured,
      sharedContactResponsibilityConfirmed: Boolean(v3.sharedContactResponsibilityConfirmed),
      poolExists:
        v3.poolExists === null || v3.poolExists === true || v3.poolExists === false ? v3.poolExists : null,
      additionalDeclarationsText: typeof v3.additionalDeclarationsText === "string" ? v3.additionalDeclarationsText : "",
      additionalDeclarationsInsufficientKnowledge: Boolean(v3.additionalDeclarationsInsufficientKnowledge),
      additionalDeclarationsRelatedSectionKeys: Array.isArray(v3.additionalDeclarationsRelatedSectionKeys)
        ? v3.additionalDeclarationsRelatedSectionKeys.filter((x): x is string => typeof x === "string")
        : [],
      additionalDeclarationsAttachedDocumentIds: Array.isArray(v3.additionalDeclarationsAttachedDocumentIds)
        ? v3.additionalDeclarationsAttachedDocumentIds.filter((x): x is string => typeof x === "string")
        : [],
      additionalDeclarationsLegalAck: Boolean(v3.additionalDeclarationsLegalAck),
      additionalDeclarationsHistory: hist,
    };
  }

  if (o.version === SELLER_DECLARATION_VERSION_LEGACY && typeof o.sellerFullName === "string") {
    const v2 = o as unknown as SellerDeclarationData;
    const name = v2.sellerFullName?.trim() ?? "";
    return {
      ...base,
      ...v2,
      version: SELLER_DECLARATION_VERSION,
      sellers: [
        {
          ...emptyParty(),
          fullName: name,
        },
      ],
      buyers: [],
      propertyAddressStructured: emptyStructuredAddress(),
      sharedContactResponsibilityConfirmed: false,
      poolExists: typeof v2.poolExists === "boolean" ? v2.poolExists : null,
    };
  }

  return {
    ...base,
    knownDefects: typeof o.knownDefects === "string" ? o.knownDefects : base.knownDefects,
    structuralConcerns: typeof o.propertyCondition === "string" ? o.propertyCondition : base.structuralConcerns,
    pastIssues: base.pastIssues,
    renovationsDetail: typeof o.renovations === "string" ? o.renovations : base.renovationsDetail,
    includedItems: typeof o.inclusions === "string" ? o.inclusions : base.includedItems,
    excludedItems: typeof o.exclusions === "string" ? o.exclusions : base.excludedItems,
    propertyDescriptionNotes: typeof o.legalStatus === "string" ? o.legalStatus : base.propertyDescriptionNotes,
  };
}

export function syncSellerFullNameFromParties(d: SellerDeclarationData): SellerDeclarationData {
  const first = d.sellers[0]?.fullName?.trim() ?? "";
  return { ...d, sellerFullName: first };
}
