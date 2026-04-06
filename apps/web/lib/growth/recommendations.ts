import type { LocaleCode } from "@/lib/i18n/types";
import type { FunnelRates } from "./funnels";
import type { GrowthEventName } from "./types";

export type GrowthRecommendationSeverity = "info" | "warning" | "critical";

export interface GrowthRecommendation {
  id: string;
  severity: GrowthRecommendationSeverity;
  title: string;
  detail: string;
  relatedEvents?: GrowthEventName[];
}

const MSGS: Record<
  LocaleCode,
  {
    lowCtrAr: string;
    syriaViewsNoBook: string;
    weakPhotos: string;
    aiAdoption: string;
    contactFirstBetter: string;
    defaultTitle: string;
    defaultDetail: string;
  }
> = {
  en: {
    lowCtrAr: "Homepage engagement may be low for Arabic visitors — review hero copy and RTL layout.",
    syriaViewsNoBook:
      "Many listing views but few booking requests in manual-first mode — tighten contact-first CTAs and host response SLAs.",
    weakPhotos: "Several listings may be missing enough photos for trust — nudge hosts to add 6+ images.",
    aiAdoption: "AI recommendation acceptance is low — review suggestion quality and disclosure copy.",
    contactFirstBetter:
      "Contact-first funnel is outperforming instant checkout in sampled events — consider highlighting it in ops playbooks.",
    defaultTitle: "Growth insight",
    defaultDetail: "Review funnel metrics and host quality checklist.",
  },
  fr: {
    lowCtrAr:
      "Engagement page d’accueil potentiellement faible pour l’arabe — vérifier le texte du hero et la mise en page RTL.",
    syriaViewsNoBook:
      "Nombreuses vues d’annonces mais peu de demandes en mode manuel — renforcer les CTA « contacter l’hôte » et les délais de réponse.",
    weakPhotos: "Des annonces manquent peut‑être de photos — inciter à 6+ images de qualité.",
    aiAdoption: "Faible adoption des suggestions IA — revoir la qualité et les mentions légales.",
    contactFirstBetter:
      "Le parcours « contact d’abord » semble plus performant sur l’échantillon — documenter pour les ops.",
    defaultTitle: "Insight croissance",
    defaultDetail: "Analyser les entonnoirs et la qualité des annonces.",
  },
  ar: {
    lowCtrAr: "قد يكون تفاعل الصفحة الرئيسية منخفضًا للزوار العرب — راجع النص والتخطيط من اليمين لليسار.",
    syriaViewsNoBook:
      "مشاهدات كثيرة لكن طلبات حجز قليلة في الوضع اليدوي — عزّز أزرار التواصل مع المضيف وسرعة الرد.",
    weakPhotos: "قد تفتقر بعض الإعلانات لعدد كافٍ من الصور — شجّع على ٦ صور أو أكثر.",
    aiAdoption: "تبنّي اقتراحات الذكاء الاصطناعي منخفض — راجع الجودة ونص الإفصاح.",
    contactFirstBetter: "مسار «التواصل أولاً» يبدو أقوى في العينة — وثّق ذلك للتشغيل.",
    defaultTitle: "ملاحظة نمو",
    defaultDetail: "راجع مؤشرات القمع وجودة الإعلانات.",
  },
};

/**
 * Rule-based, ops-safe recommendations (no auto-actions). Localized for admin UI locale.
 */
export function buildManagerGrowthRecommendations(
  adminLocale: LocaleCode,
  counts: Partial<Record<GrowthEventName, number>>,
  rates: FunnelRates,
  hints?: { arabicSharePct?: number | null; syriaMarketSharePct?: number | null },
): GrowthRecommendation[] {
  const m = MSGS[adminLocale] ?? MSGS.en;
  const out: GrowthRecommendation[] = [];

  const lp = counts.landing_page_viewed ?? 0;
  const lv = counts.listing_viewed ?? 0;
  if (hints?.arabicSharePct != null && hints.arabicSharePct > 25 && lp > 20 && lv / lp < 0.05) {
    out.push({
      id: "homepage_ctr_ar",
      severity: "warning",
      title: m.defaultTitle,
      detail: m.lowCtrAr,
      relatedEvents: ["landing_page_viewed", "listing_viewed"],
    });
  }

  if (hints?.syriaMarketSharePct != null && hints.syriaMarketSharePct > 15) {
    const br = counts.booking_request_submitted ?? 0;
    if (lv > 30 && br / lv < 0.01) {
      out.push({
        id: "syria_views_low_book",
        severity: "warning",
        title: m.defaultTitle,
        detail: m.syriaViewsNoBook,
        relatedEvents: ["listing_viewed", "booking_request_submitted"],
      });
    }
  }

  if (rates.listingViewToBookingRequestPct != null && rates.listingViewToBookingRequestPct < 0.5 && lv > 50) {
    out.push({
      id: "weak_booking_intent",
      severity: "info",
      title: m.defaultTitle,
      detail: m.weakPhotos,
      relatedEvents: ["listing_viewed", "booking_request_started"],
    });
  }

  const aiRate = computeAiAdoptionRate(counts);
  if (aiRate != null && aiRate < 2 && (counts.ai_suggestion_accepted ?? 0) < 5) {
    out.push({
      id: "ai_adoption",
      severity: "info",
      title: m.defaultTitle,
      detail: m.aiAdoption,
      relatedEvents: ["ai_suggestion_accepted"],
    });
  }

  if (rates.syriaManualVsOnlineBookingCompleteRatio != null && rates.syriaManualVsOnlineBookingCompleteRatio > 0.35) {
    out.push({
      id: "contact_first_outperform",
      severity: "info",
      title: m.defaultTitle,
      detail: m.contactFirstBetter,
      relatedEvents: ["contact_host_clicked", "payment_completed", "manual_payment_marked_received"],
    });
  }

  if (out.length === 0) {
    out.push({
      id: "all_clear",
      severity: "info",
      title: m.defaultTitle,
      detail: m.defaultDetail,
    });
  }

  return out;
}

/** Helper: AI adoption rate from events (accepted / implied impressions proxy). */
export function computeAiAdoptionRate(counts: Partial<Record<GrowthEventName, number>>): number | null {
  const acc = counts.ai_suggestion_accepted ?? 0;
  const views = counts.listing_viewed ?? 0;
  if (views <= 0) return null;
  return (acc / views) * 100;
}
