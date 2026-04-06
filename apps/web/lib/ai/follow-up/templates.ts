/**
 * Multilingual follow-up templates. Placeholders: {firstName}, {listingTitle}, {city}, {platformName}
 */
import type { Lead } from "@prisma/client";

export type FollowUpLocale = "en" | "fr" | "ar";

const DEFAULT_PLATFORM = "LECIPM";

export function detectLocaleFromHint(hint?: string | null): FollowUpLocale {
  const h = (hint ?? "en").toLowerCase().slice(0, 5);
  if (h.startsWith("fr")) return "fr";
  if (h.startsWith("ar")) return "ar";
  return "en";
}

export type TemplateKey =
  | "immediate_response"
  | "no_response_follow_up"
  | "viewing_invitation"
  | "broker_callback_confirmation"
  | "price_drop_similar"
  | "missed_call_follow_up"
  | "voice_script_intro"
  | "assistant_disclosure_sms";

const BUILT_IN: Record<FollowUpLocale, Record<TemplateKey, string>> = {
  en: {
    assistant_disclosure_sms:
      "You're messaging an automated assistant for {platformName} — not a licensed broker.",
    immediate_response:
      "Hi{firstName}, thanks for your interest{listingRef}. I can help with basic details and connect you with a broker quickly. Are you looking to buy soon?",
    no_response_follow_up:
      "Hey{firstName}! Just checking if you're still interested 😊 I can help you book a visit or send similar listings.",
    viewing_invitation:
      "Hey{firstName}! Just checking if you're still interested 😊 I can help you book a visit or send similar listings.",
    broker_callback_confirmation:
      "Got it{firstName}. A broker will reach out at the time you prefer. Reply STOP to opt out.",
    price_drop_similar:
      "Hi{firstName}, there's an update on a property you viewed{listingRef}. Want similar listings or a broker call?",
    missed_call_follow_up:
      "Hey{firstName}! Just checking if you're still interested 😊 I can help you book a visit or send similar listings.",
    voice_script_intro:
      "Hi, this is the virtual assistant for {platformName}, following up on your interest{listingRef}. I can collect a few details and connect you with a broker. Is now a good time?",
  },
  fr: {
    assistant_disclosure_sms:
      "Vous écrivez à un assistant automatisé pour {platformName} — pas un courtier licencié.",
    immediate_response:
      "Bonjour{firstName}, merci pour votre intérêt{listingRef}. Je peux donner des infos générales et vous mettre en contact avec un courtier rapidement. Souhaitez-vous acheter bientôt ?",
    no_response_follow_up:
      "Bonjour{firstName} ! Toujours intéressé(e) ? Je peux aider à planifier une visite ou envoyer des annonces similaires.",
    viewing_invitation:
      "Bonjour{firstName} ! Toujours intéressé(e) ? Je peux aider à planifier une visite ou envoyer des annonces similaires.",
    broker_callback_confirmation:
      "C'est noté{firstName}. Un courtier vous contactera. Répondez STOP pour ne plus recevoir de messages.",
    price_drop_similar:
      "Bonjour{firstName}, nouvelle info sur une propriété que vous avez consultée{listingRef}. Propriétés similaires ou appel d'un courtier ?",
    missed_call_follow_up:
      "Bonjour{firstName} ! Toujours intéressé(e) ? Je peux aider à planifier une visite ou envoyer des annonces similaires.",
    voice_script_intro:
      "Bonjour, c'est l'assistant virtuel de {platformName}, suite à votre intérêt{listingRef}. Je peux recueillir quelques informations et vous mettre en contact avec un courtier. Est-ce un bon moment ?",
  },
  ar: {
    assistant_disclosure_sms:
      "أنت تتواصل مع مساعد آلي لـ {platformName} — وليس وسيط عقارات مرخّص.",
    immediate_response:
      "مرحبًا{firstName}، شكرًا لاهتمامك{listingRef}. يمكنني تقديم تفاصيل أساسية وربطك بوسيط بسرعة. هل تنوي الشراء قريبًا؟",
    no_response_follow_up:
      "مرحبًا{firstName}، متابعة لاهتمامك{listingRef}. هل تريد اتصالًا من الوسيط أو قوائم مشابهة؟",
    viewing_invitation:
      "شكرًا لاهتمامك{listingRef}. هل تريد أن يتواصل الوسيط لجدولة زيارة؟",
    broker_callback_confirmation:
      "تم{firstName}. سيتواصل الوسيط معك. أرسل STOP لإلغاء الرسائل.",
    price_drop_similar:
      "مرحبًا{firstName}، تحديث بخصوص عقار اطلعت عليه{listingRef}. قوائم مشابهة أو اتصال؟",
    missed_call_follow_up:
      "مرحبًا{firstName}، حاولنا التواصل بخصوص استفسارك{listingRef}. أرسل نعم للاتصال.",
    voice_script_intro:
      "مرحبًا، معك المساعد الآلي لـ {platformName} بخصوص اهتمامك{listingRef}. يمكنني جمع بعض التفاصيل وربطك بالوسيط. هل الوقت مناسب؟",
  },
};

function firstName(lead: Pick<Lead, "name">): string {
  const n = lead.name?.trim().split(/\s+/)[0];
  return n ? ` ${n}` : "";
}

function listingRef(vars: { listingTitle?: string | null; city?: string | null }): string {
  if (vars.listingTitle) return ` in ${vars.listingTitle}`;
  if (vars.city) return ` in ${vars.city}`;
  return "";
}

export function renderFollowUpTemplate(
  key: TemplateKey,
  locale: FollowUpLocale,
  lead: Pick<Lead, "name">,
  vars: { listingTitle?: string | null; city?: string | null },
  overrides?: Record<string, Record<TemplateKey, string>> | null
): string {
  const ov = overrides?.[locale]?.[key];
  const raw = ov ?? BUILT_IN[locale][key] ?? BUILT_IN.en[key];
  const platformName = process.env.COMPANY_NAME?.trim() || DEFAULT_PLATFORM;
  const ref = listingRef(vars);
  return raw
    .replace(/\{firstName\}/g, firstName(lead))
    .replace(/\{listingRef\}/g, ref)
    .replace(/\{listingTitle\}/g, vars.listingTitle ?? "this property")
    .replace(/\{city\}/g, vars.city ?? "")
    .replace(/\{platformName\}/g, platformName);
}
