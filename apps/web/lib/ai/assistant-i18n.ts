/**
 * Trilingual assistant responses for LECIPM.
 *
 * Priority: fr-CA (Québécois) → en-CA → ar (Arabic)
 */

export type AssistantLang = "fr-CA" | "en-CA" | "ar";

export const SUPPORTED_ASSISTANT_LANGS: { code: AssistantLang; label: string; dir: "ltr" | "rtl" }[] = [
  { code: "fr-CA", label: "Français", dir: "ltr" },
  { code: "en-CA", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
];

export function getDefaultAssistantLang(): AssistantLang {
  return "fr-CA";
}

const GREETING: Record<AssistantLang, string> = {
  "fr-CA": [
    "Bonjour et bienvenue chez LECIPM — Le Carrefour Immobilier Prestige !",
    "Je suis votre assistante personnelle. Je peux vous aider à trouver des propriétés,",
    "réserver un séjour BNHub, ou répondre à toute question sur notre plateforme.",
    "Comment puis-je vous aider aujourd'hui ?",
  ].join(" "),
  "en-CA": [
    "Welcome to LECIPM — Le Carrefour Immobilier Prestige!",
    "I'm your personal assistant. I can help you find properties,",
    "book a BNHub stay, or answer any questions about our platform.",
    "How can I help you today?",
  ].join(" "),
  "ar": [
    "مرحباً بكم في LECIPM — لو كارفور إيموبيلييه بريستيج!",
    "أنا مساعدتكم الشخصية. يمكنني مساعدتكم في إيجاد العقارات،",
    "حجز إقامة BNHub، أو الإجابة على أي سؤال حول منصتنا.",
    "كيف يمكنني مساعدتكم اليوم؟",
  ].join(" "),
};

const PLATFORM_INTRO: Record<AssistantLang, string> = {
  "fr-CA": [
    "LECIPM (Le Carrefour Immobilier Prestige) est une plateforme immobilière complète basée au Québec.",
    "Nous offrons : la vente et l'achat de propriétés (FSBO et avec courtier),",
    "les locations court terme BNHub, un CRM courtier, des outils hypothécaires,",
    "l'analyse IA de transactions, et un système de confiance TrustGraph.",
    "Notre mission : rendre l'immobilier accessible, transparent et sécuritaire pour tous.",
    "Fondée par Mashhour Investments, nous servons le marché québécois avec fierté.",
  ].join(" "),
  "en-CA": [
    "LECIPM (Le Carrefour Immobilier Prestige) is a comprehensive real estate platform based in Quebec.",
    "We offer: property buying and selling (FSBO and broker-assisted),",
    "BNHub short-term rentals, broker CRM, mortgage tools,",
    "AI-powered deal analysis, and a TrustGraph verification system.",
    "Our mission: make real estate accessible, transparent, and secure for everyone.",
    "Founded by Mashhour Investments, we proudly serve the Quebec market.",
  ].join(" "),
  "ar": [
    "LECIPM (لو كارفور إيموبيلييه بريستيج) هي منصة عقارية شاملة مقرها في كيبيك.",
    "نقدم: بيع وشراء العقارات، إيجارات قصيرة المدة BNHub،",
    "إدارة علاقات الوسطاء، أدوات الرهن العقاري،",
    "تحليل الصفقات بالذكاء الاصطناعي، ونظام التحقق TrustGraph.",
    "مهمتنا: جعل العقارات متاحة وشفافة وآمنة للجميع.",
    "تأسست بواسطة Mashhour Investments، نخدم سوق كيبيك بفخر.",
  ].join(" "),
};

const RESPONSES: Record<string, Record<AssistantLang, string>> = {
  booking_help: {
    "fr-CA": [
      "Pour les séjours BNHub : choisissez d'abord vos dates d'arrivée et de départ —",
      "le total se met à jour avec taxes et frais avant le paiement.",
      "Remplissez les détails invité, puis payez en toute sécurité via le checkout.",
      "Vous recevrez une confirmation avec les prochaines étapes.",
    ].join(" "),
    "en-CA": [
      "For BNHub stays: pick your check-in and check-out dates first —",
      "the total updates with taxes and fees before you pay.",
      "Complete guest details, then pay securely through checkout.",
      "You'll receive confirmation with next steps.",
    ].join(" "),
    "ar": [
      "لإقامات BNHub: اختاروا تواريخ الوصول والمغادرة أولاً —",
      "يتم تحديث المبلغ الإجمالي مع الضرائب والرسوم قبل الدفع.",
      "أكملوا تفاصيل الضيف، ثم ادفعوا بأمان عبر صفحة الدفع.",
      "ستتلقون تأكيداً مع الخطوات التالية.",
    ].join(" "),
  },
  unlock_help: {
    "fr-CA": [
      "Le déblocage du contact propriétaire est disponible sur les annonces éligibles.",
      "Complétez la vérification affichée, puis achetez le déblocage si offert —",
      "vous obtiendrez les coordonnées uniquement après un déblocage réussi.",
    ].join(" "),
    "en-CA": [
      "Owner contact unlock is available on eligible listings from the listing page.",
      "Complete any verification shown, then purchase unlock if offered —",
      "you'll get contact details only after a successful unlock.",
    ].join(" "),
    "ar": [
      "فتح معلومات الاتصال بالمالك متاح على الإعلانات المؤهلة.",
      "أكملوا التحقق المعروض، ثم اشتروا الفتح إذا كان متاحاً —",
      "ستحصلون على تفاصيل الاتصال فقط بعد فتح ناجح.",
    ].join(" "),
  },
  broker_help: {
    "fr-CA": "Vous pouvez demander un courtier de la plateforme depuis les annonces disponibles, ou vous inscrire comme client depuis le menu principal.",
    "en-CA": "You can request a platform broker from listing CTAs where available, or sign up as a client from the main menu.",
    "ar": "يمكنكم طلب وسيط من المنصة من الإعلانات المتاحة، أو التسجيل كعميل من القائمة الرئيسية.",
  },
  mortgage_help: {
    "fr-CA": "Les outils hypothécaires et demandes d'experts se trouvent sous Finance / Hypothèque. Je ne peux pas citer de taux — consultez un courtier agréé.",
    "en-CA": "Mortgage tools and expert requests live under Finance / Mortgage. I can't quote rates — speak to a licensed broker.",
    "ar": "أدوات الرهن العقاري وطلبات الخبراء موجودة تحت قسم التمويل / الرهن العقاري. لا أستطيع تقديم أسعار — تحدثوا مع وسيط مرخص.",
  },
  host_help: {
    "fr-CA": "Pour inscrire un séjour ou une propriété : ouvrez Héberger / Inscrire votre propriété depuis BNHub ou le hub vendeur, complétez la vérification, puis publiez.",
    "en-CA": "To list a stay or property: open Host / List your property from BNHub or the seller hub, complete verification, then publish when ready.",
    "ar": "لإدراج إقامة أو عقار: افتحوا استضافة / أدرجوا عقاركم من BNHub أو مركز البائع، أكملوا التحقق، ثم انشروا.",
  },
  general_platform_help: {
    "fr-CA": "Essayez : cherchez par ville et prix, sauvegardez des annonces, ou utilisez BNHub pour les séjours courts. Demandez comment fonctionne la réservation ou le déblocage de contact.",
    "en-CA": "Try: search by city and price, save listings, or use BNHub for short stays. Ask how booking or contact unlock works anytime.",
    "ar": "جربوا: ابحثوا حسب المدينة والسعر، احفظوا الإعلانات، أو استخدموا BNHub للإقامات القصيرة. اسألوا عن كيفية الحجز أو فتح معلومات الاتصال.",
  },
  compare_listings: {
    "fr-CA": "Pour comparer, ouvrez deux annonces ou utilisez Sauvegarder — puis redemandez. Je peux comparer prix, chambres et superficie.",
    "en-CA": "To compare, open two listings or use Save — then ask again. I can contrast price, beds, and size when both are available.",
    "ar": "للمقارنة، افتحوا إعلانين أو استخدموا الحفظ — ثم اسألوا مجدداً. يمكنني مقارنة السعر والغرف والمساحة.",
  },
  unsupported: {
    "fr-CA": "Je n'ai pas compris. Essayez : « condo 2 chambres à Montréal sous 650k », « séjour à Laval ce weekend », ou « Comment réserver un séjour ? »",
    "en-CA": "I didn't catch that. Try: '2 bedroom condo in Montreal under 650k', 'short stay in Laval this weekend', or 'How do I book a stay?'",
    "ar": "لم أفهم ذلك. جربوا: \"شقة غرفتين في مونتريال أقل من 650 ألف\"، \"إقامة قصيرة في لافال هذا الأسبوع\"، أو \"كيف أحجز إقامة؟\"",
  },
  listing_explainer_stay: {
    "fr-CA": "Sur cette page de séjour : consultez les photos, équipements, règles et conditions d'annulation. Sélectionnez les dates et le nombre d'invités pour voir le prix total.",
    "en-CA": "On this stay page: review photos, amenities, house rules, and cancellation terms. Select dates and guest count to see the full price.",
    "ar": "في صفحة الإقامة هذه: راجعوا الصور والمرافق وقواعد المنزل وشروط الإلغاء. اختاروا التواريخ وعدد الضيوف لرؤية السعر الكامل.",
  },
  listing_explainer_property: {
    "fr-CA": "Consultez le prix, l'emplacement et les caractéristiques de cette annonce. Utilisez Sauvegarder ou Comparer si disponible. Pour contacter le vendeur, utilisez les boutons sur l'annonce.",
    "en-CA": "Review price, location, and features on this listing. Use Save or Compare when available. To contact the seller or broker, use the buttons on the listing.",
    "ar": "راجعوا السعر والموقع والميزات في هذا الإعلان. استخدموا الحفظ أو المقارنة إذا كانت متاحة. للتواصل مع البائع، استخدموا الأزرار على الإعلان.",
  },
  search_updated: {
    "fr-CA": "Recherche mise à jour. Ouverture des résultats.",
    "en-CA": "Updated your search. Opening results.",
    "ar": "تم تحديث البحث. فتح النتائج.",
  },
};

export function getGreeting(lang: AssistantLang): string {
  return GREETING[lang];
}

export function getPlatformIntro(lang: AssistantLang): string {
  return PLATFORM_INTRO[lang];
}

export function getLocalizedResponse(key: string, lang: AssistantLang): string {
  return RESPONSES[key]?.[lang] ?? RESPONSES[key]?.["en-CA"] ?? "";
}

export function detectInputLang(text: string): AssistantLang | null {
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/\b(bonjour|cherche|chambre|maison|prix|comment|séjour|propriété|aide|est-ce que|je veux|montréal|québec)\b/i.test(text)) return "fr-CA";
  if (/\b(hello|find|search|bedroom|house|price|how|help|looking|property)\b/i.test(text)) return "en-CA";
  return null;
}
