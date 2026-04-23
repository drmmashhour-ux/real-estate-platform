import type { LanguagePolicy } from "@/lib/compliance/quebec/language-policy";
import { DEFAULT_QUEBEC_LANGUAGE_POLICY } from "@/lib/compliance/quebec/language-policy";
import {
  assertResidentialLicenceType,
  scanResidentialScopeViolations,
} from "@/lib/compliance/quebec/broker-residential-attestation";
import { detectMessageLanguage } from "@/lib/compliance/quebec/translation-engine";

export const FRENCH_VERSION_REQUIRED_MESSAGE = "French version required for Québec compliance";

export type QuebecLanguageViolation = {
  code: string;
  message: string;
};

function stringifyDraft(draft: unknown): string {
  if (draft == null) return "";
  if (typeof draft === "string") return draft;
  try {
    return JSON.stringify(draft);
  } catch {
    return "";
  }
}

function hasSubstantiveFrench(text: string): boolean {
  const t = text.trim();
  if (t.length < 8) return false;
  if (/[àâäéèêëïîôùûüç]/i.test(t)) return true;
  return /\b(le|la|les|des|maison|condo|chambre|propriété|visite|notaire|vendre)\b/i.test(t);
}

function isEnglishHeavyPublicCopy(text: string): boolean {
  const t = text.toLowerCase();
  const en = (t.match(/\b(the|and|with|beautiful|spacious|bedroom|bath|sqft|garage)\b/g) ?? []).length;
  const fr = (t.match(/\b(le|la|les|et|avec|chambre|salle|pièces|garage)\b/g) ?? []).length;
  return en >= 2 && fr < 2;
}

export type ListingPublicLanguageInput = {
  title: string;
  titleFr: string | null | undefined;
  assistantDraftContent: unknown;
};

/**
 * Enforces: substantive French available for public CRM listing surfaces (title + assistant draft heuristics).
 */
export function validateFrenchPublicListingContent(
  listing: ListingPublicLanguageInput,
  policy: LanguagePolicy = DEFAULT_QUEBEC_LANGUAGE_POLICY,
): { ok: boolean; violations: QuebecLanguageViolation[] } {
  const violations: QuebecLanguageViolation[] = [];
  if (!policy.requireFrenchForPublicContent) {
    return { ok: true, violations };
  }

  const title = listing.title?.trim() ?? "";
  const titleFr = listing.titleFr?.trim() ?? "";
  const draftStr = stringifyDraft(listing.assistantDraftContent);
  const combinedFrSurface = [titleFr, draftStr].filter(Boolean).join("\n");

  const titleLooksFr = hasSubstantiveFrench(title) && detectMessageLanguage(title) !== "EN";
  const frSurfaceOk = hasSubstantiveFrench(combinedFrSurface) || titleLooksFr;

  if (!frSurfaceOk) {
    violations.push({
      code: "MISSING_FRENCH_PUBLIC_COPY",
      message: FRENCH_VERSION_REQUIRED_MESSAGE,
    });
  }

  const primaryForVisibility = [title, titleFr].filter(Boolean).join(" ");
  if (
    titleFr.length < 12 &&
    isEnglishHeavyPublicCopy(primaryForVisibility) &&
    !hasSubstantiveFrench(titleFr)
  ) {
    violations.push({
      code: "ENGLISH_ONLY_AD_VISIBILITY",
      message:
        "Public copy appears English-primary without a visible French equivalent — add a professional French title or description.",
    });
  }

  return { ok: violations.length === 0, violations };
}

export function validateResidentialScopeForPublish(params: {
  marketingText: string;
  licenceType: string | null | undefined;
}): { ok: boolean; violations: QuebecLanguageViolation[] } {
  const violations: QuebecLanguageViolation[] = [];
  const scope = assertResidentialLicenceType(params.licenceType);
  if (!scope.ok && scope.violation) {
    violations.push({ code: "LICENCE_SCOPE", message: scope.violation });
  }
  for (const msg of scanResidentialScopeViolations(params.marketingText)) {
    violations.push({ code: "COMMERCIAL_SCOPE_LEAK", message: msg });
  }
  return { ok: violations.length === 0, violations };
}
