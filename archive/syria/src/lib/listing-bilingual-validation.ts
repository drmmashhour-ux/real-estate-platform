/**
 * Deterministic bilingual listing copy rules — Arabic required for authored content; English optional.
 * No throws.
 */

export type BilingualListingCopyInput = {
  titleAr: string;
  descriptionAr: string;
  titleEn?: string | null;
  descriptionEn?: string | null;
};

export type BilingualListingCopyFailureReason = "missing_title_ar" | "missing_description_ar";

export function validateBilingualListingCopy(input: BilingualListingCopyInput): {
  ok: boolean;
  reason?: BilingualListingCopyFailureReason;
} {
  try {
    const ta = typeof input.titleAr === "string" ? input.titleAr.trim() : "";
    const da = typeof input.descriptionAr === "string" ? input.descriptionAr.trim() : "";
    if (!ta) return { ok: false, reason: "missing_title_ar" };
    if (!da) return { ok: false, reason: "missing_description_ar" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "missing_title_ar" };
  }
}
