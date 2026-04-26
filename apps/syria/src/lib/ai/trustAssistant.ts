export type TrustWarning = { id: string; messageEn: string; messageAr: string };

export type TrustAssistantInput = {
  photoCount: number;
  amenityCount: number;
  /** `verified` field on listing */
  verified: boolean;
  listingVerified: boolean;
};

/**
 * Suggestions only — never block users or assert verification.
 */
export function getTrustWarnings(input: TrustAssistantInput): TrustWarning[] {
  const out: TrustWarning[] = [];

  if (input.photoCount < 1) {
    out.push({
      id: "photos",
      messageEn: "Ask for photos before visiting.",
      messageAr: "اطلب صوراً قبل زيارة العقار.",
    });
  }

  if (input.amenityCount < 1) {
    out.push({
      id: "amenities",
      messageEn: "Confirm electricity, water, and location before payment.",
      messageAr: "تأكد من الكهرباء والمياه والموقع بدقة قبل الدفع.",
    });
  }

  if (!input.verified && !input.listingVerified) {
    out.push({
      id: "unverified",
      messageEn: "Verify details before sending money.",
      messageAr: "تحقق من التفاصيل قبل إرسال أموال.",
    });
  }

  return out;
}

export function getTrustWarningLines(input: TrustAssistantInput, locale: string): string[] {
  return getTrustWarnings(input).map((w) => (locale.startsWith("ar") ? w.messageAr : w.messageEn));
}
