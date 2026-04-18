export type OutreachChannel = "instagram_dm" | "email_short" | "email_long" | "call";

export type OutreachScriptPack = {
  channel: OutreachChannel;
  title: string;
  body: string;
  placeholders: string[];
  reviewRequired: true;
  law25Note: string;
};

const LAW25 =
  "Draft only — obtain consent before sending; no automated bulk messaging. Québec Law 25: document purpose, allow opt-out where applicable.";

/**
 * Editable templates with `[placeholders]` — operators personalize before any send.
 */
export function buildOutreachScript(
  channel: OutreachChannel,
  tokens: { area: string; founderFirstName?: string }
): OutreachScriptPack {
  const area = tokens.area.trim() || "[neighbourhood]";
  const fn = tokens.founderFirstName?.trim() || "[your name]";

  if (channel === "instagram_dm") {
    return {
      channel,
      title: "Instagram DM (short)",
      body: [
        `Hey — I noticed a stay-host in ${area}. I’m building LECIPM (BNHub + Québec brokerage tools).`,
        `We help hosts with transparent pricing + Stripe-backed checkout where enabled — no obligation.`,
        `If you’re open to a 15‑min call, reply here and I’ll suggest times.`,
        `— ${fn}`,
      ].join("\n"),
      placeholders: ["area", "founderFirstName"],
      reviewRequired: true,
      law25Note: LAW25,
    };
  }

  if (channel === "email_short") {
    return {
      channel,
      title: "Email (short)",
      body: [
        `Subject: BNHub / LECIPM — ${area}`,
        ``,
        `Hi — I’m ${fn}. We’re onboarding Montreal hosts to LECIPM: short-term tools with clear fees and Law 25–aligned outreach.`,
        `Happy to share how checkout and host payouts work on Stripe — reply if useful.`,
        ``,
        `— LECIPM`,
      ].join("\n"),
      placeholders: ["area", "founderFirstName"],
      reviewRequired: true,
      law25Note: LAW25,
    };
  }

  if (channel === "email_long") {
    return {
      channel,
      title: "Email (detailed)",
      body: [
        `Subject: Transparent host economics — ${area}`,
        ``,
        `Hi —`,
        ``,
        `I’m ${fn} with LECIPM. We combine BNHub (guest checkout + host tools) with residential brokerage rails for teams who want one stack.`,
        `Fees are configuration-driven; guests see line items before paying with Stripe. We don’t promise “more bookings” without data — we focus on compliant workflows and pricing transparency.`,
        `If you want a walkthrough, reply with a good time — drafts are human-reviewed; no automated follow-ups without consent.`,
        ``,
        `— LECIPM`,
      ].join("\n"),
      placeholders: ["area", "founderFirstName"],
      reviewRequired: true,
      law25Note: LAW25,
    };
  }

  return {
    channel: "call",
    title: "Call script",
    body: [
      `Intro: ${fn} — LECIPM / BNHub, Montreal-first.`,
      `Value: transparent fees, Stripe checkout, host dashboard — brokerage tools optional.`,
      `Objection (fees): compare net after your inputs in our ROI tool — no fabricated “vs Airbnb savings”.`,
      `Objection (time): offer 15 minutes; send follow-up email draft for review.`,
      `Close: permission to send one email recap — no spam sequences.`,
    ].join("\n"),
    placeholders: ["founderFirstName"],
    reviewRequired: true,
    law25Note: LAW25,
  };
}
