/**
 * In-app sales copy for launch / manual outreach (DM, call, close, follow-up).
 */

export const LAUNCH_DM_FIRST_CONTACT = `Hey! I saw you're looking for a place in {city}. I help people find properties and get mortgage approval easily. If you want, I can guide you for free 🙂`;

export const LAUNCH_DM_FOLLOW_UP = `Just checking — are you still looking? I can connect you with verified experts and help you move faster.`;

export const LAUNCH_DM_URGENCY = `Some good opportunities are coming this week. If you want, I can send you options before they go public.`;

export const LAUNCH_CALL_SCRIPT = {
  intro: `Hi, I'm Mohamed, I help people buy/rent and get mortgage approval.`,
  needs: [`Budget?`, `Timeline?`, `Location?`],
  value: `I can connect you with experts and help you move faster and safer.`,
  close: `Let's get you started today.`,
} as const;

export const LAUNCH_CLOSING_SCRIPT = `If we start now, we can secure better options before others. I'll guide you step by step — it's free for you.`;

export const LAUNCH_FOLLOW_UP_SEQUENCE = [
  {
    day: 1,
    label: "Day 1: follow-up",
    body: `Following up on my note — happy to answer questions or hop on a quick call when works for you.`,
  },
  {
    day: 3,
    label: "Day 3: reminder",
    body: `Quick reminder — I can line up viewings or a FREE mortgage pre-approval chat at no cost. Want me to hold a time?`,
  },
  {
    day: 7,
    label: "Day 7: last message",
    body: `Last ping from me — if timing isn't right, no worries. If you want help later, just reply "later" and I'll check back.`,
  },
] as const;

export function personalizeLaunchTemplate(
  template: string,
  ctx: { name?: string | null; city?: string | null }
): string {
  const raw = (ctx.name ?? "there").trim();
  const firstName = raw.split(/\s+/)[0] || "there";
  const city = (ctx.city ?? "Montreal").trim() || "Montreal";
  return template
    .replace(/\{firstName\}/g, firstName)
    .replace(/\{city\}/g, city)
    .replace(/\{name\}/g, raw || "there");
}
