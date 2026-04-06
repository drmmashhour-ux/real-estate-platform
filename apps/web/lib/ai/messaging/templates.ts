/**
 * BNHub host-controlled lifecycle message templates (EN / FR / AR).
 * Variables: guestName, listingTitle, checkInLabel, checkOutLabel, nights
 */

export type MessageTemplateLocale = "en" | "fr" | "ar";

export type TemplateVariables = {
  guestName: string;
  listingTitle: string;
  checkInLabel: string;
  checkOutLabel: string;
  nights: number;
};

export type HostLifecycleTemplateKey =
  | "booking_confirmation"
  | "pre_checkin"
  | "checkin_welcome"
  | "checkout_reminder"
  | "post_stay_thank_you"
  | "host_checklist_pre"
  | "host_checklist_post";

const TEMPLATES: Record<
  HostLifecycleTemplateKey,
  Record<MessageTemplateLocale, (v: TemplateVariables) => string>
> = {
  booking_confirmation: {
    en: (v) =>
      `Your booking is confirmed. We look forward to hosting you, ${v.guestName}, at “${v.listingTitle}” (${v.checkInLabel} – ${v.checkOutLabel}).`,
    fr: (v) =>
      `Votre réservation est confirmée. Nous avons hâte de vous accueillir, ${v.guestName}, à « ${v.listingTitle} » (${v.checkInLabel} – ${v.checkOutLabel}).`,
    ar: (v) =>
      `تم تأكيد حجزك. نتطلع لاستضافتك، ${v.guestName}، في «${v.listingTitle}» (${v.checkInLabel} – ${v.checkOutLabel}).`,
  },
  pre_checkin: {
    en: (v) =>
      `Your stay is coming up at “${v.listingTitle}”. Please confirm your arrival time, ${v.guestName}.`,
    fr: (v) =>
      `Votre séjour approche à « ${v.listingTitle} ». Merci de confirmer votre heure d’arrivée, ${v.guestName}.`,
    ar: (v) =>
      `اقترب موعد إقامتك في «${v.listingTitle}». يرجى تأكيد وقت وصولك، ${v.guestName}.`,
  },
  checkin_welcome: {
    en: (v) => `Welcome, ${v.guestName}! Please make yourself comfortable at “${v.listingTitle}” and contact us if needed.`,
    fr: (v) =>
      `Bienvenue, ${v.guestName} ! Installez-vous à « ${v.listingTitle} » et contactez-nous si besoin.`,
    ar: (v) => `مرحبًا ${v.guestName}! تصرّف وكأنك في منزلك في «${v.listingTitle}» وتواصل معنا عند الحاجة.`,
  },
  checkout_reminder: {
    en: (v) =>
      `Checkout time is approaching for “${v.listingTitle}”. Please ensure the space is left as expected, ${v.guestName}.`,
    fr: (v) =>
      `L’heure du départ approche pour « ${v.listingTitle} ». Merci de laisser les lieux en bon état, ${v.guestName}.`,
    ar: (v) =>
      `يقترب وقت المغادرة لـ «${v.listingTitle}». يرجى ترك المكان كما هو متوقع، ${v.guestName}.`,
  },
  post_stay_thank_you: {
    en: (v) => `Thank you for your stay at “${v.listingTitle}”, ${v.guestName}. We hope to host you again.`,
    fr: (v) => `Merci pour votre séjour à « ${v.listingTitle} », ${v.guestName}. Au plaisir de vous accueillir à nouveau.`,
    ar: (v) => `شكرًا لإقامتك في «${v.listingTitle}»، ${v.guestName}. نأمل أن نرحب بك مجددًا.`,
  },
  host_checklist_pre: {
    en: () =>
      `Internal checklist: Before guest arrival — confirm room clean, amenities ready, and listing items available. Nothing missing.`,
    fr: () =>
      `Liste interne : avant l’arrivée — vérifier propreté, équipements prêts et articles prévus. Rien ne manque.`,
    ar: () =>
      `قائمة داخلية: قبل وصول الضيف — تأكد من نظافة الغرفة، جاهزية المرافق، وتوفر المقتنيات المذكورة.`,
  },
  host_checklist_post: {
    en: () =>
      `Internal checklist: After checkout — verify room condition and confirm no missing items.`,
    fr: () =>
      `Liste interne : après le départ — vérifier l’état des lieux et confirmer qu’aucun objet ne manque.`,
    ar: () =>
      `قائمة داخلية: بعد المغادرة — راجع حالة الغرفة وتأكد من عدم فقدان أي عناصر.`,
  },
};

export function resolveTemplateLocale(raw: string | null | undefined): MessageTemplateLocale {
  const s = (raw ?? "en").trim().toLowerCase();
  if (s.startsWith("fr")) return "fr";
  if (s.startsWith("ar")) return "ar";
  return "en";
}

export function renderHostLifecycleTemplate(
  key: HostLifecycleTemplateKey,
  locale: MessageTemplateLocale,
  variables: TemplateVariables
): string {
  const fn = TEMPLATES[key][locale] ?? TEMPLATES[key].en;
  return fn(variables);
}

export const PLATFORM_LIABILITY_DISCLAIMER_AUTOMATION =
  "Hosts are responsible for property condition, guest experience, and communication. The platform provides automation tools only.";
