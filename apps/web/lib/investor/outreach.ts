/**
 * Optional traction + geo hints for 51.1 outreach drafts (read from live metrics when the server calls `sendInvestorMessage`).
 */
export type InvestorMessageContext = {
  /** e.g. primary launch metro — set `INVESTOR_PITCH_CITY_FOCUS` or `NEXT_PUBLIC_DEFAULT_MARKET_CITY` in env. */
  cityFocus?: string;
  earlyUserCount?: number;
  activeCampaignsCount?: number;
};

/**
 * Cold / warm investor intro copy (Order 51 / 51.1). Edit here; paste into email or CRM.
 * No real email is sent from the product layer in safe mode.
 */
export function generateInvestorMessage(name: string, ctx?: InvestorMessageContext) {
  const who = name.trim() || "there";
  const cityLine =
    ctx?.cityFocus && ctx.cityFocus.length > 0
      ? `\nWe are especially focused on traction in **${ctx.cityFocus}** as an early launch market.`
      : "";
  const parts: string[] = [];
  if (ctx?.earlyUserCount != null) {
    parts.push(`~${ctx.earlyUserCount} early user(s) in the cohort`);
  }
  if (ctx?.activeCampaignsCount != null) {
    parts.push(`${ctx.activeCampaignsCount} active simulated campaign(s) in the growth engine`);
  }
  const tractionLine = parts.length > 0 ? `\n\nQuick snapshot: ${parts.join(" · ")}.` : "";
  return `
Hi ${who},

I'm building LECIPM, a self-optimizing real estate marketplace that uses AI to manage pricing, trust, compliance, and growth.
${cityLine}${tractionLine}

We've built a working platform with:
- dynamic pricing engine
- compliance automation
- autonomous optimization system

We are currently onboarding our first users and would love to share a short demo with you.

Would you be open to a quick 10-minute call?

Best regards,
Founder
`.trimStart();
}
