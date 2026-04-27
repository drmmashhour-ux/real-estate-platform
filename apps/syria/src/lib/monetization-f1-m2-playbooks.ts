/**
 * Order M2 — Payment closing: operator copy/paste templates (WhatsApp).
 * Keep in sync with ops; amounts may also use the F1 ladder server-side.
 */

export const F1_M2_STANDARD_REPLY_AR = `أهلاً 👋
تمييز الإعلان يعطيك ظهور أعلى وعدد اتصالات أكبر

السعر: 50,000 ل.س لمدة 7 أيام

يمكنك الدفع عبر:

* تحويل
* أو تسليم مباشر

أرسل تأكيد الدفع وسيتم التفعيل فوراً`;

export const F1_M2_AFTER_PAYMENT_AR = `تم استلام الدفع ✅
سيتم تمييز إعلانك الآن`;

/** Send if no owner reply within ~12–24h (manual follow-up). */
export const F1_M2_FOLLOWUP_AR = `هل ما زلت ترغب في تمييز الإعلان؟`;
