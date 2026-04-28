/**
 * ORDER SYBNB-72 — Semi-automation layer for Hadiah ops & agents (Arabic copy-paste scripts).
 * Formal automation / tooling gates — prefer repeating manual workflows ≥ threshold below before codifying.
 */

/** Gate repeated ops patterns before investing in automation (cron/Business API/playbooks-as-code). */
export const SYBNB72_MIN_REPEAT_BEFORE_AUTOMATE = 10;

/** Warm outbound DM — agents personalize `{city}` / listing hooks verbally */
export const SYBNB72_DM_OUTREACH_SCRIPT_AR = `مرحبا 👋 نتواصل من منصّة هدية لينك — عندنا ضيوف يبحثون عن إقامة في منطقتك. تحب نشرح الخطوة التالية؟`;

/** Lightweight chase — complements SYBNB-70 guest follow-ups (supply-side partner ping). */
export const SYBNB72_PARTNER_FOLLOW_UP_SCRIPT_AR = `تحية سريعة — ما زال عندنا اهتمام على إعلانك. جاهز نكمّل؟ 😊`;

/** Closing handshake once activation/truthfulness verified — operators localize tiers verbally */
export const SYBNB72_CLOSING_SCRIPT_AR = `تمام 👍 تم ضبط ظهورك — أي تعديل على الأسعار أو الصور خبرنا بسرعة لأفضل نتيجة.`;
