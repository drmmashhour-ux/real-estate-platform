/**
 * Hub label resolution — English default; FR/AR ready without hardcoding in components.
 * Pass literal English in registry as fallback via labelKey matching keys below.
 */

export type HubLocale = "en" | "fr" | "ar";

const DICT: Record<string, Record<HubLocale, string>> = {
  "hub.bnhub.label": { en: "BNHub", fr: "BNHub", ar: "BNHub" },
  "hub.bnhub.description": {
    en: "Short-term stays and hospitality.",
    fr: "Séjours de courte durée et hospitalité.",
    ar: "إقامات قصيرة وضيافة.",
  },
  "hub.carhub.label": { en: "CarHub", fr: "CarHub", ar: "CarHub" },
  "hub.carhub.description": {
    en: "Vehicle rentals.",
    fr: "Location de véhicules.",
    ar: "تأجير المركبات.",
  },
  "hub.servicehub.label": { en: "ServiceHub", fr: "ServiceHub", ar: "ServiceHub" },
  "hub.servicehub.description": {
    en: "Add-ons and partner services.",
    fr: "Services additionnels et partenaires.",
    ar: "خدمات إضافية وشركاء.",
  },
  "hub.investorhub.label": { en: "InvestorHub", fr: "InvestorHub", ar: "InvestorHub" },
  "hub.investorhub.description": {
    en: "Investor metrics and insights.",
    fr: "Métriques et analyses investisseurs.",
    ar: "مقاييس ورؤى المستثمرين.",
  },
  "hub.brokerhub.label": { en: "BrokerHub", fr: "BrokerHub", ar: "BrokerHub" },
  "hub.brokerhub.description": {
    en: "Broker transactions and CRM.",
    fr: "Transactions de courtage et CRM.",
    ar: "معاملات الوساطة وإدارة علاقات العملاء.",
  },
  "hub.section.overview": { en: "Overview", fr: "Vue d’ensemble", ar: "نظرة عامة" },
  "hub.section.items": { en: "Listings", fr: "Annonces", ar: "القوائم" },
  "hub.section.bookings": { en: "Bookings", fr: "Réservations", ar: "الحجوزات" },
  "hub.section.calendar": { en: "Calendar", fr: "Calendrier", ar: "التقويم" },
  "hub.section.messages": { en: "Messages", fr: "Messages", ar: "الرسائل" },
  "hub.section.revenue": { en: "Revenue", fr: "Revenus", ar: "الإيرادات" },
  "hub.section.ai": { en: "AI recommendations", fr: "Recommandations IA", ar: "توصيات الذكاء الاصطناعي" },
  "hub.section.operations": { en: "Operations", fr: "Opérations", ar: "العمليات" },
  "nav.dashboard": { en: "Dashboard", fr: "Tableau de bord", ar: "لوحة التحكم" },
  "nav.find_stay": { en: "Find a stay", fr: "Trouver un séjour", ar: "اعثر على إقامة" },
  "nav.trips": { en: "Trips", fr: "Voyages", ar: "الرحلات" },
  "nav.host": { en: "Host", fr: "Hôte", ar: "المضيف" },
  "nav.explore": { en: "Explore", fr: "Explorer", ar: "استكشف" },
  "nav.services": { en: "Services", fr: "Services", ar: "الخدمات" },
  "nav.insights": { en: "Insights", fr: "Analyses", ar: "رؤى" },
  "filter.city": { en: "City", fr: "Ville", ar: "المدينة" },
  "filter.dates": { en: "Dates", fr: "Dates", ar: "التواريخ" },
  "filter.guests": { en: "Guests", fr: "Invités", ar: "الضيوف" },
  "filter.price": { en: "Price", fr: "Prix", ar: "السعر" },
  "price.lodging": { en: "Lodging", fr: "Hébergement", ar: "الإقامة" },
  "price.tax": { en: "Taxes", fr: "Taxes", ar: "الضرائب" },
  "price.service_fee": { en: "Service fee", fr: "Frais de service", ar: "رسوم الخدمة" },
};

export function resolveHubLabel(labelKey: string, locale: HubLocale = "en"): string {
  const row = DICT[labelKey];
  if (row) return row[locale] ?? row.en;
  return labelKey;
}

/** Arabic UI should set dir="rtl" on shell — caller responsibility. */
export function hubLocaleDirection(locale: HubLocale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
