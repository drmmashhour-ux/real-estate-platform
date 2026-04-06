/**
 * Seller declaration integrity: address vs property type, duplicate IDs, shared contact rules.
 * Used for mark-complete and optional client-side hints.
 */

import type { PartyIdentity, SellerDeclarationData, StructuredPropertyAddress } from "@/lib/fsbo/seller-declaration-schema";

const CA_POSTAL_RE = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeIdNumber(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function normalizePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidCanadianPostalCode(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  return CA_POSTAL_RE.test(s);
}

export function isReasonableEmail(raw: string): boolean {
  const t = raw.trim();
  return t.length > 3 && EMAIL_RE.test(t);
}

/** North America–oriented: at least 10 digits when digits present */
export function isReasonablePhone(raw: string): boolean {
  const d = normalizePhoneDigits(raw);
  return d.length >= 10 && d.length <= 15;
}

export function isCondoPropertyType(propertyType: string | null | undefined): boolean {
  return (propertyType ?? "").toUpperCase() === "CONDO";
}

export function isHouseLikePropertyType(propertyType: string | null | undefined): boolean {
  const t = (propertyType ?? "").toUpperCase();
  return t === "SINGLE_FAMILY" || t === "TOWNHOUSE" || t === "MULTI_FAMILY";
}

export type SellerDeclarationValidationResult = {
  ok: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
  warnings: string[];
  /** Non-blocking AI-style prompts */
  verifyPrompts: string[];
};

function nonEmpty(s: unknown, min = 2): boolean {
  return typeof s === "string" && s.trim().length >= min;
}

function partyFieldsFilled(p: PartyIdentity): boolean {
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

function structuredAddressFilled(a: StructuredPropertyAddress): boolean {
  return (
    nonEmpty(a.street, 2) &&
    nonEmpty(a.city, 2) &&
    nonEmpty(a.postalCode, 5) &&
    isValidCanadianPostalCode(a.postalCode)
  );
}

/** Duplicate ID numbers across sellers (strict — never allowed). */
export function findDuplicateSellerIds(sellers: PartyIdentity[]): { dupIds: string[]; indices: number[][] } {
  const byNorm = new Map<string, number[]>();
  for (let i = 0; i < sellers.length; i++) {
    const n = normalizeIdNumber(sellers[i].idNumber ?? "");
    if (n.length < 3) continue;
    const prev = byNorm.get(n) ?? [];
    prev.push(i);
    byNorm.set(n, prev);
  }
  const dupIds: string[] = [];
  const indices: number[][] = [];
  for (const [, idx] of byNorm) {
    if (idx.length > 1) {
      dupIds.push(sellers[idx[0]]?.idNumber ?? "");
      indices.push(idx);
    }
  }
  return { dupIds, indices };
}

export function validateStructuredAddressVsPropertyType(
  propertyType: string | null | undefined,
  addr: StructuredPropertyAddress
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const unit = addr.unit?.trim() ?? "";
  const condo = isCondoPropertyType(propertyType);
  const house = isHouseLikePropertyType(propertyType);

  if (condo && !unit) {
    errors.push("For a condominium, add a unit / apartment number.");
  }
  if (house && unit.length > 0) {
    errors.push("For a detached or house-type property, remove the unit field unless this is a legal secondary suite with its own civic number.");
  }
  if ((condo && !unit) || (house && unit.length > 0)) {
    warnings.push(
      "If property type and address structure do not match, please verify your entry."
    );
  }
  return { errors, warnings };
}

/** Same normalized phone appears on more than one seller (non-empty phones). */
export function sellerSharesPhoneWithAnother(sellers: PartyIdentity[], index: number): boolean {
  const d = normalizePhoneDigits(sellers[index]?.phone ?? "");
  if (d.length < 10) return false;
  const matches = sellers.filter((s) => normalizePhoneDigits(s.phone ?? "") === d);
  return matches.length > 1;
}

export function sellerSharesEmailWithAnother(sellers: PartyIdentity[], index: number): boolean {
  const e = normalizeEmail(sellers[index]?.email ?? "");
  if (e.length < 4) return false;
  const matches = sellers.filter((s) => normalizeEmail(s.email ?? "") === e);
  return matches.length > 1;
}

function duplicatePhoneGroups(sellers: PartyIdentity[]): Map<string, number[]> {
  const m = new Map<string, number[]>();
  for (let i = 0; i < sellers.length; i++) {
    const d = normalizePhoneDigits(sellers[i].phone ?? "");
    if (d.length < 10) continue;
    const prev = m.get(d) ?? [];
    prev.push(i);
    m.set(d, prev);
  }
  return new Map([...m].filter(([, idx]) => idx.length > 1));
}

function duplicateEmailGroups(sellers: PartyIdentity[]): Map<string, number[]> {
  const m = new Map<string, number[]>();
  for (let i = 0; i < sellers.length; i++) {
    const e = normalizeEmail(sellers[i].email ?? "");
    if (e.length < 4) continue;
    const prev = m.get(e) ?? [];
    prev.push(i);
    m.set(e, prev);
  }
  return new Map([...m].filter(([, idx]) => idx.length > 1));
}

function allInGroupMarkedShared(sellers: PartyIdentity[], indices: number[]): boolean {
  return indices.every((i) => sellers[i]?.sharedContact === true);
}

/** True when duplicate phone/email groups are fully marked shared — user must confirm responsibility. */
export function needsSharedContactResponsibilityAck(d: SellerDeclarationData): boolean {
  const sellers = d.sellers ?? [];
  const phoneDup = duplicatePhoneGroups(sellers);
  for (const idx of phoneDup.values()) {
    if (idx.length > 1 && allInGroupMarkedShared(sellers, idx)) return true;
  }
  const emailDup = duplicateEmailGroups(sellers);
  for (const idx of emailDup.values()) {
    if (idx.length > 1 && allInGroupMarkedShared(sellers, idx)) return true;
  }
  return false;
}

export function validateSellerDeclarationIntegrity(
  d: SellerDeclarationData,
  propertyType: string | null | undefined
): SellerDeclarationValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  const warnings: string[] = [];
  const verifyPrompts: string[] = [];

  const sellers = d.sellers ?? [];
  const addr = d.propertyAddressStructured ?? { street: "", unit: "", city: "", postalCode: "" };

  if (!d.hasAuthorityToSell) {
    errors.push("Confirm you have authority to sell (Identity section).");
    fieldErrors["hasAuthorityToSell"] = "Required";
  }
  if (!nonEmpty(d.identityNotes, 2)) {
    errors.push("Add identity / authority notes.");
    fieldErrors["identityNotes"] = "Add a short note (co-owners, mandate, etc.)";
  }

  if (!structuredAddressFilled(addr)) {
    const msg = "Enter street, city, and a valid Canadian postal code (A1A 1A1).";
    errors.push(msg);
    if (!nonEmpty(addr.street, 2)) fieldErrors["propertyAddressStructured.street"] = "Required";
    if (!nonEmpty(addr.city, 2)) fieldErrors["propertyAddressStructured.city"] = "Required";
    if (!nonEmpty(addr.postalCode, 5) || !isValidCanadianPostalCode(addr.postalCode)) {
      fieldErrors["propertyAddressStructured.postalCode"] = "Valid Canadian postal code required";
    }
  }

  const addrVsType = validateStructuredAddressVsPropertyType(propertyType, addr);
  errors.push(...addrVsType.errors);
  warnings.push(...addrVsType.warnings);

  if (isCondoPropertyType(propertyType) && !d.isCondo) {
    const msg = "Listing property type is condo, so the divided co-ownership / DSD-style section must be confirmed.";
    errors.push(msg);
    fieldErrors["isCondo"] = "Confirm condo / divided co-ownership status";
  }

  const { indices: dupIdxGroups } = findDuplicateSellerIds(sellers);
  if (dupIdxGroups.length > 0) {
    errors.push("Each seller must use a unique ID number.");
    for (const group of dupIdxGroups) {
      for (const i of group) {
        fieldErrors[`sellers.${i}.idNumber`] = "This ID is already used by another seller.";
      }
    }
  }

  const phoneDup = duplicatePhoneGroups(sellers);
  let phoneDupBlocked = false;
  for (const [, idx] of phoneDup) {
    if (!allInGroupMarkedShared(sellers, idx)) {
      phoneDupBlocked = true;
      for (const i of idx) {
        fieldErrors[`sellers.${i}.phone`] =
          "This phone number is already used for another seller. Check “Use same phone…” or change the number.";
      }
    }
  }
  if (phoneDupBlocked) {
    errors.push(
      "The same phone number is used for more than one seller — confirm shared contact or use distinct numbers."
    );
  }

  const emailDup = duplicateEmailGroups(sellers);
  let emailDupBlocked = false;
  for (const [, idx] of emailDup) {
    if (!allInGroupMarkedShared(sellers, idx)) {
      emailDupBlocked = true;
      for (const i of idx) {
        fieldErrors[`sellers.${i}.email`] =
          "This email is already used for another seller. Check “Use same email…” or change it.";
      }
    }
  }
  if (emailDupBlocked) {
    errors.push(
      "The same email is used for more than one seller — confirm shared contact or use distinct addresses."
    );
  }

  let sharedDuplicateGroupConfirmed = false;
  for (const idx of phoneDup.values()) {
    if (idx.length > 1 && allInGroupMarkedShared(sellers, idx)) sharedDuplicateGroupConfirmed = true;
  }
  for (const idx of emailDup.values()) {
    if (idx.length > 1 && allInGroupMarkedShared(sellers, idx)) sharedDuplicateGroupConfirmed = true;
  }
  if (sharedDuplicateGroupConfirmed && !d.sharedContactResponsibilityConfirmed) {
    errors.push(
      "Confirm that shared phone or email between sellers is intentional and accurate (checkbox required)."
    );
    fieldErrors["sharedContactResponsibilityConfirmed"] = "Required when contact info is shared between sellers";
  }

  for (let i = 0; i < sellers.length; i++) {
    const s = sellers[i];
    if (!isReasonableEmail(s.email ?? "")) {
      fieldErrors[`sellers.${i}.email`] = fieldErrors[`sellers.${i}.email`] ?? "Enter a valid email address";
      errors.push(`Seller ${i + 1}: invalid email format.`);
    }
    if (!isReasonablePhone(s.phone ?? "")) {
      fieldErrors[`sellers.${i}.phone`] = fieldErrors[`sellers.${i}.phone`] ?? "Enter a valid phone number (include area code)";
      errors.push(`Seller ${i + 1}: invalid phone format.`);
    }
    if (!partyFieldsFilled(s)) {
      errors.push(`Seller ${i + 1}: complete all identity fields and ID document upload.`);
    }
  }

  if (d.isCondo) {
    if (!nonEmpty(d.condoContingencyFundDetails, 12)) {
      errors.push("Add condo contingency-fund details or a short factual explanation.");
      fieldErrors["condoContingencyFundDetails"] = "Required for condo / divided co-ownership";
    }
    if (!nonEmpty(d.condoCommonServicesNotes, 8)) {
      warnings.push("Add condo rules or common-services notes for better co-ownership disclosure.");
    }
  }

  // Suspicious patterns (non-blocking prompts)
  const fullLine = `${addr.street}, ${addr.unit}, ${addr.city}`.toLowerCase();
  if (addr.street && fullLine.split(addr.street.toLowerCase()).length > 2) {
    verifyPrompts.push("Please verify your information.");
  }
  for (const s of sellers) {
    const inc = (s.annualIncome ?? "").replace(/[^\d.]/g, "");
    const n = Number.parseFloat(inc);
    if (Number.isFinite(n) && (n > 50_000_000 || n < 0)) {
      verifyPrompts.push("Annual income looks unusual — please verify your information.");
      break;
    }
  }

  const ok = errors.length === 0;
  return { ok, errors: [...new Set(errors)], fieldErrors, warnings: [...new Set(warnings)], verifyPrompts: [...new Set(verifyPrompts)] };
}

/** For section 1 UI status — requires property type from listing */
export function isIdentityDeclarationCompleteForUi(
  d: Partial<SellerDeclarationData>,
  propertyType: string | null | undefined
): boolean {
  const sellers = d.sellers ?? [];
  if (sellers.length < 1) return false;
  const merged = {
    ...d,
    sellers,
    propertyAddressStructured: d.propertyAddressStructured ?? {
      street: "",
      unit: "",
      city: "",
      postalCode: "",
    },
    sharedContactResponsibilityConfirmed: Boolean(d.sharedContactResponsibilityConfirmed),
    hasAuthorityToSell: Boolean(d.hasAuthorityToSell),
    identityNotes: d.identityNotes ?? "",
  } as SellerDeclarationData;
  return validateSellerDeclarationIntegrity(merged, propertyType).ok;
}
