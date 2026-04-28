/**
 * Deterministic narration copy — static strings only. No interpolation, user data, or secrets.
 */
export type NarrationLang = "en" | "ar";

export type NarrationTexts = {
  en: string;
  ar: string;
};

export const narrationRegistry: Record<string, NarrationTexts> = {
  STORY_PROBLEM: {
    en: "This market lacks trust, automation, and protection for buyers and hosts alike.",
    ar: "هذا السوق يفتقر إلى الثقة والأتمتة والحماية للمشترين والمضيفين على حد سواء.",
  },
  STORY_SOLUTION: {
    en: "Our platform solves this with AI-driven verification, operator tooling, and zero-risk demo journeys.",
    ar: "منصتنا تعالج ذلك بالتحقق المعتمد على الذكاء الاصطناعي وأدوات المشغلين وتجارب تجريبية بلا مخاطر.",
  },
  STORY_CLOSING: {
    en: "This creates a safer, smarter marketplace investors can scale with confidence.",
    ar: "هذا يخلق سوقاً أكثر أماناً وذكاءً يمكن للمستثمرين توسيعه بثقة.",
  },
  "/demo": {
    en: "This is the SYBNB marketplace. Listings are verified and ranked using trust and quality signals.",
    ar: "هذا سوق SYBNB حيث تُتحقق القوائم وتُرتَّب وفق إشارات الثقة والجودة.",
  },
  "/listing": {
    en: "This listing is owned by a verified host. Availability and pricing are managed automatically.",
    ar: "هذا الإعلان لمالك موثَّق. يُدار التوفر والتسعير تلقائياً.",
  },
  "/sybnb": {
    en: "Browse approved listings in the marketplace; unsafe inventory stays hidden behind operator gates.",
    ar: "تصفَّح القوائم المعتمدة في السوق؛ المحتوى غير الآمن يبقى مخفياً خلف بوابات المشغِّلين.",
  },
  ACTION_REQUEST_BOOKING: {
    en: "When a guest requests a booking, the system validates trust signals before allowing confirmation.",
    ar: "عند طلب الحجز، يتحقق النظام من إشارات الثقة قبل السماح بالتأكيد.",
  },
  ACTION_HOST_CONFIRM: {
    en: "The host confirms the booking. Risk checks are applied before proceeding.",
    ar: "يؤكد المضيف الحجز. تُطبَّق فحوصات المخاطر قبل المتابعة.",
  },
  ACTION_PAYMENT_BLOCKED: {
    en: "Payments are intentionally blocked in demo mode to ensure zero financial risk.",
    ar: "المدفوعات معطَّلة في الوضع التجريبي عن قصد لتجنُّب أي مخاطر مالية.",
  },
  "/admin/dr-brain": {
    en: "Dr. Brain monitors the system in real time and detects anomalies before they impact users.",
    ar: "يراقب «دكتور برين» النظام لحظياً ويكتشف الشذوذ قبل أن يؤثر على المستخدمين.",
  },
  "/admin/sybnb/reports": {
    en: "Operator reporting summarizes marketplace trust and booking quality without exposing sensitive records.",
    ar: "تلخص تقارير المشغِّلين ثقة السوق وجودة الحجوزات دون كشف سجلات حسّاسة.",
  },
};
