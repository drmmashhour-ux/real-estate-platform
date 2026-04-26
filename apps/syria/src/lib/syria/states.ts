/**
 * Syria governorates (structured filter; users may also type free-form city/area text).
 * Values are stable English display keys stored in `SyriaProperty.state`.
 */
export const SYRIA_STATES = [
  "Damascus",
  "Rif Dimashq",
  "Aleppo",
  "Homs",
  "Hama",
  "Latakia",
  "Tartus",
  "Idlib",
  "Daraa",
  "Quneitra",
  "Deir ez-Zor",
  "Raqqa",
  "Al-Hasakah",
  "As-Suwayda",
] as const

export type SyriaStateEn = (typeof SYRIA_STATES)[number]

export const SYRIA_STATE_LABELS_AR: Record<string, string> = {
  Damascus: "دمشق",
  "Rif Dimashq": "ريف دمشق",
  Aleppo: "حلب",
  Homs: "حمص",
  Hama: "حماة",
  Latakia: "اللاذقية",
  Tartus: "طرطوس",
  Idlib: "إدلب",
  Daraa: "درعا",
  Quneitra: "القنيطرة",
  "Deir ez-Zor": "دير الزور",
  Raqqa: "الرقة",
  "Al-Hasakah": "الحسكة",
  "As-Suwayda": "السويداء",
}

export function labelSyriaState(
  en: string | null | undefined,
  locale: "en" | "ar" | (string & {}),
): string {
  if (!en || !en.trim()) return ""
  if (locale === "ar" && SYRIA_STATE_LABELS_AR[en]) {
    return SYRIA_STATE_LABELS_AR[en]
  }
  return en
}

export const SYRIA_STATE_OPTIONS: { value: string; labelEn: string; labelAr: string }[] =
  SYRIA_STATES.map((en) => ({
    value: en,
    labelEn: en,
    labelAr: SYRIA_STATE_LABELS_AR[en] ?? en,
  }))

/** Arabic labels in the same order as `SYRIA_STATES`. */
export const SYRIA_STATES_AR: string[] = SYRIA_STATES.map((en) => SYRIA_STATE_LABELS_AR[en] ?? en)
