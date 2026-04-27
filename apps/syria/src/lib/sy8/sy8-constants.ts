/** Canonical report reason keys (stored in DB; UI shows Arabic in `Sy8.reportReasons`). */
export const SY8_REPORT_REASONS = [
  "fraud",
  "duplicate",
  "wrong_price",
  "wrong_info",
] as const;

export type Sy8ReportReasonKey = (typeof SY8_REPORT_REASONS)[number];

/** Combined Syria + Sybnb reports per listing — threshold for quarantine. */
export const SY8_REPORTS_THRESHOLD = 5;

export function isSy8ReportReasonKey(s: string): s is Sy8ReportReasonKey {
  return (SY8_REPORT_REASONS as readonly string[]).includes(s);
}

/** API/UI may send Arabic labels (order SY8-2). */
const ARABIC_TO_REPORT_KEY: Readonly<Record<string, Sy8ReportReasonKey>> = {
  احتيال: "fraud",
  مكرر: "duplicate",
  "سعر غير صحيح": "wrong_price",
  "معلومات غير صحيحة": "wrong_info",
};

export function normalizeSy8ReportReason(input: string): Sy8ReportReasonKey {
  const t = input.trim();
  if (isSy8ReportReasonKey(t)) {
    return t;
  }
  const fromAr = ARABIC_TO_REPORT_KEY[t];
  if (fromAr) {
    return fromAr;
  }
  return "wrong_info";
}
