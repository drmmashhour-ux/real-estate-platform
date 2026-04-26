/**
 * Syria: governorate → city → bilingual area.
 * DB `city` stores `SyriaCity.name_en` (stable). `area` stores Arabic `name_ar` for known districts, or free text.
 */

export type SyriaArea = {
  name_ar: string;
  name_en: string;
};

export type SyriaCity = {
  name_ar: string;
  name_en: string;
  areas: SyriaArea[];
};

export type SyriaGovernorate = {
  name_ar: string;
  name_en: string;
  cities: SyriaCity[];
};

export const SYRIA_LOCATIONS: SyriaGovernorate[] = [
  {
    name_ar: "دمشق",
    name_en: "Damascus",
    cities: [
      {
        name_ar: "دمشق",
        name_en: "Damascus",
        areas: [
          { name_ar: "المزة", name_en: "Mezzeh" },
          { name_ar: "كفرسوسة", name_en: "Kafr Souseh" },
          { name_ar: "المالكي", name_en: "Al-Maliki" },
          { name_ar: "أبو رمانة", name_en: "Abu Rummaneh" },
          { name_ar: "باب توما", name_en: "Bab Touma" },
          { name_ar: "القصاع", name_en: "Qassaa" },
          { name_ar: "ركن الدين", name_en: "Rukn al-Din" },
          { name_ar: "المهاجرين", name_en: "Muhajreen" },
        ],
      },
    ],
  },
  {
    name_ar: "ريف دمشق",
    name_en: "Rif Dimashq",
    cities: [
      {
        name_ar: "جرمانا",
        name_en: "Jaramana",
        areas: [
          { name_ar: "جرمانا القديمة", name_en: "Old Jaramana" },
          { name_ar: "التضامن", name_en: "Tadamon" },
        ],
      },
      {
        name_ar: "دوما",
        name_en: "Douma",
        areas: [{ name_ar: "مركز المدينة", name_en: "City Center" }],
      },
      {
        name_ar: "داريا",
        name_en: "Darayya",
        areas: [{ name_ar: "داريا البلد", name_en: "Darayya Center" }],
      },
    ],
  },
  {
    name_ar: "حلب",
    name_en: "Aleppo",
    cities: [
      {
        name_ar: "حلب",
        name_en: "Aleppo",
        areas: [
          { name_ar: "الجميلية", name_en: "Jdeideh" },
          { name_ar: "الفرقان", name_en: "Al-Furqan" },
          { name_ar: "صلاح الدين", name_en: "Salah al-Din" },
          { name_ar: "الحمدانية", name_en: "Hamadaniyeh" },
          { name_ar: "الأشرفية", name_en: "Ashrafieh" },
        ],
      },
    ],
  },
  {
    name_ar: "حمص",
    name_en: "Homs",
    cities: [
      {
        name_ar: "حمص",
        name_en: "Homs",
        areas: [
          { name_ar: "الوعر", name_en: "Al-Waer" },
          { name_ar: "كرم الشامي", name_en: "Karam al-Shami" },
          { name_ar: "الخالدية", name_en: "Khaldiyeh" },
        ],
      },
    ],
  },
  {
    name_ar: "حماة",
    name_en: "Hama",
    cities: [
      {
        name_ar: "حماة",
        name_en: "Hama",
        areas: [
          { name_ar: "المدينة", name_en: "City Center" },
          { name_ar: "القصور", name_en: "Al-Qusour" },
        ],
      },
    ],
  },
  {
    name_ar: "اللاذقية",
    name_en: "Latakia",
    cities: [
      {
        name_ar: "اللاذقية",
        name_en: "Latakia",
        areas: [
          { name_ar: "الرمل", name_en: "Al-Raml" },
          { name_ar: "الصليبة", name_en: "Al-Saliba" },
          { name_ar: "المشروع السابع", name_en: "Project 7" },
        ],
      },
    ],
  },
  {
    name_ar: "طرطوس",
    name_en: "Tartus",
    cities: [
      {
        name_ar: "طرطوس",
        name_en: "Tartus",
        areas: [
          { name_ar: "المدينة", name_en: "City Center" },
          { name_ar: "الشيخ سعد", name_en: "Sheikh Saad" },
        ],
      },
    ],
  },
  {
    name_ar: "إدلب",
    name_en: "Idlib",
    cities: [
      {
        name_ar: "إدلب",
        name_en: "Idlib",
        areas: [{ name_ar: "مركز المدينة", name_en: "City Center" }],
      },
    ],
  },
  {
    name_ar: "الرقة",
    name_en: "Raqqa",
    cities: [
      {
        name_ar: "الرقة",
        name_en: "Raqqa",
        areas: [{ name_ar: "مركز المدينة", name_en: "City Center" }],
      },
    ],
  },
  {
    name_ar: "دير الزور",
    name_en: "Deir ez-Zor",
    cities: [
      {
        name_ar: "دير الزور",
        name_en: "Deir ez-Zor",
        areas: [{ name_ar: "المدينة", name_en: "City Center" }],
      },
    ],
  },
  {
    name_ar: "الحسكة",
    name_en: "Al-Hasakah",
    cities: [
      {
        name_ar: "الحسكة",
        name_en: "Al-Hasakah",
        areas: [{ name_ar: "مركز المدينة", name_en: "City Center" }],
      },
    ],
  },
  {
    name_ar: "درعا",
    name_en: "Daraa",
    cities: [
      {
        name_ar: "درعا",
        name_en: "Daraa",
        areas: [{ name_ar: "درعا البلد", name_en: "Daraa al-Balad" }],
      },
    ],
  },
  {
    name_ar: "السويداء",
    name_en: "As-Suwayda",
    cities: [
      {
        name_ar: "السويداء",
        name_en: "As-Suwayda",
        areas: [{ name_ar: "مركز المدينة", name_en: "City Center" }],
      },
    ],
  },
  {
    name_ar: "القنيطرة",
    name_en: "Quneitra",
    cities: [
      {
        name_ar: "القنيطرة",
        name_en: "Quneitra",
        areas: [{ name_ar: "مركز المدينة", name_en: "City Center" }],
      },
    ],
  },
];

/** Top-level governorates — for headers and external exports. */
export const SYRIA_GOVERNORATES: Pick<SyriaGovernorate, "name_ar" | "name_en">[] = SYRIA_LOCATIONS.map(
  ({ name_ar, name_en }) => ({ name_ar, name_en }),
);

/** All cities in tree order (governorate order, then city order). */
export function allSyriaCitiesFlat(): SyriaCity[] {
  return SYRIA_LOCATIONS.flatMap((g) => g.cities);
}

export type SyriaCityResolved = {
  governorate: SyriaGovernorate;
  city: SyriaCity;
};

/** Find city by stored `SyriaCity.name_en` or `SyriaCity.name_ar` (public search + DB). */
export function findSyriaCityByStored(stored: string): SyriaCityResolved | undefined {
  const q = stored.trim();
  if (!q) return undefined;
  for (const governorate of SYRIA_LOCATIONS) {
    for (const city of governorate.cities) {
      if (city.name_en === q || city.name_ar === q) return { governorate, city };
    }
  }
  return undefined;
}

/** Area option value stored in DB / query string (Arabic label — matches legacy + search). */
export function areaStorageValue(a: SyriaArea): string {
  return a.name_ar;
}

/** Label for UI from a SyriaArea. */
export function areaDisplayLabel(a: SyriaArea, locale: string): string {
  return locale.startsWith("ar") ? a.name_ar : a.name_en;
}
