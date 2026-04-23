import type { PersonalizationContext } from "./automation.types";

function greet(ctx: PersonalizationContext): string {
  return ctx.name?.trim() ? `Hi ${ctx.name.trim()}` : "Hi there";
}

function loc(ctx: PersonalizationContext): string {
  return ctx.location?.trim() ? ` in ${ctx.location.trim()}` : "";
}

/**
 * Deterministic email bodies — swap for CMS / LLM later.
 * Returns subject + plain-text body (HTML can wrap caller-side).
 */
export function renderEmail(
  templateKey: string,
  ctx: PersonalizationContext
): { subject: string; body: string } {
  const g = greet(ctx);
  const L = loc(ctx);

  switch (templateKey) {
    case "new_lead_welcome":
      return {
        subject: ctx.name?.trim()
          ? `${ctx.name.trim().split(/\s+/)[0]!} — your LECIPM hub`
          : "Welcome — your LECIPM hub",
        body: `${g},\n\nThanks for raising your hand${L}. We’ll line up listings and a broker match that fit how you actually buy.\n\n— LECIPM Growth`,
      };
    case "new_lead_followup":
      return {
        subject: `Still browsing${L}?`,
        body: `${g},\n\nQuick follow-up: want a short list of homes worth touring this week, or a financing sanity-check first?\n\nReply with “LIST” or “CALL”.\n\n— LECIPM`,
      };
    case "new_lead_listings_suggestions":
      return {
        subject: `Listings picked for your intent (${ctx.intent})`,
        body: `${g},\n\nBased on what you’ve viewed (${ctx.listingViews ?? 0} listing signals), here are three curated matches${L}.\n\nOpen the hub to compare side-by-side.\n\n— LECIPM`,
      };
    case "broker_intro":
      return {
        subject: "LECIPM for brokers — pipeline without portal tax",
        body: `${g},\n\nLECIPM routes buyer intent to you with context (not cold clicks). Want a 12-minute platform walkthrough?\n\nReply DEMO.\n\n— Partnerships`,
      };
    case "broker_demo_followup":
      return {
        subject: "Pick a demo slot",
        body: `${g},\n\nFollowing up — here’s a calendar link for a guided demo and sandbox listings feed.\n\n— LECIPM`,
      };
    case "investor_pitch":
      return {
        subject: "Investor memo — yield, risk, execution",
        body: `${g},\n\nAttached summary: how deals flow from BNHub + listings into diligence checkpoints${L}.\n\nWant a partner call this week?\n\n— Investor desk`,
      };
    case "investor_meeting_invite":
      return {
        subject: "Investor sync — 25 minutes",
        body: `${g},\n\nInvite: portfolio fit + underwriting rhythm on LECIPM.\n\nReply YES with timezone.\n\n— Investor desk`,
      };
    default:
      return {
        subject: "LECIPM",
        body: `${g},\n\nWe received your interest (${ctx.intent})${L}.\n\n— Growth automation`,
      };
  }
}
