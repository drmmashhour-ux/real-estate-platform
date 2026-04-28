/**
 * Listing copy rules — Arabic title required for dashboards / forms that align with Hadiah Link UX.
 * ORDER SYBNB-88 — description length/format not enforced (casual Arabic & dialect welcome).
 */

export type BilingualListingCopyInput = {
  titleAr: string;
  descriptionAr: string;
  titleEn?: string | null;
  descriptionEn?: string | null;
};

export type BilingualListingCopyFailureReason = "missing_title_ar";

export function validateBilingualListingCopy(input: BilingualListingCopyInput): {
  ok: boolean;
  reason?: BilingualListingCopyFailureReason;
} {
  try {
    const ta = typeof input.titleAr === "string" ? input.titleAr.trim() : "";
    if (!ta) return { ok: false, reason: "missing_title_ar" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "missing_title_ar" };
  }
}
