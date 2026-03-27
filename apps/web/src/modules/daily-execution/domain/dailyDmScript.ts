const DEFAULT_DM = `Hey — quick question.

I'm building an AI platform that helps brokers:

• know what to do in a deal
• avoid costly mistakes
• guide decisions step by step

Would you be open to a quick 15-min demo?`;

const VARIANT_CTAS = [
  "Would you be open to a quick 15-min demo?",
  "Open to a 15-min walkthrough this week?",
  "Can I show you a 15-min version on your calendar?",
] as const;

export type DailyDmResult = {
  script: string;
  variantIndex: number;
};

/**
 * Deterministic outreach script. User copies and sends manually — platform never sends DMs.
 */
export function generateDailyDM(options?: { variantIndex?: number; customOpening?: string }): DailyDmResult {
  const idx =
    options?.variantIndex != null
      ? Math.abs(Math.floor(options.variantIndex)) % VARIANT_CTAS.length
      : 0;
  const cta = VARIANT_CTAS[idx];
  const opening = options?.customOpening?.trim();
  const body = opening
    ? `${opening}\n\nI'm building an AI platform that helps brokers:\n\n• know what to do in a deal\n• avoid costly mistakes\n• guide decisions step by step\n\n${cta}`
    : DEFAULT_DM.replace("Would you be open to a quick 15-min demo?", cta);
  return { script: body.trim(), variantIndex: idx };
}

/** Next variant for “Regenerate”. */
export function regenerateDailyDM(currentVariant: number): DailyDmResult {
  return generateDailyDM({ variantIndex: currentVariant + 1 });
}
