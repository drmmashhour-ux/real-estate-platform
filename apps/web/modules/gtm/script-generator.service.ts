import { PRICING } from "@/lib/monetization/pricing";
import type { GtmChannel, GtmScriptRequest, GtmSegment } from "./gtm.types";

function segmentLabel(s: GtmSegment): string {
  const m: Record<GtmSegment, string> = {
    host_bnhub: "BNHub host",
    broker: "broker partner",
    seller: "private seller",
    buyer: "buyer",
    investor: "investor",
  };
  return m[s];
}

/**
 * Draft outreach — **review before send**; fees pulled from config constants only.
 */
export function generateGtmScript(req: GtmScriptRequest): { title: string; body: string; reviewRequired: true } {
  const who = segmentLabel(req.segment);
  const market = req.market?.trim() || "your market";
  const leadCad = (PRICING.leadPriceCents / 100).toFixed(0);

  const lines: string[] = [];

  if (req.channel === "short_pitch") {
    lines.push(
      `LECIPM helps ${who}s run transparent Québec-ready workflows — Stripe-backed payments where enabled, fees explained upfront.`
    );
    lines.push(`We’re focused on ${market} first; happy to walk through the product with no obligation.`);
  } else if (req.channel === "long_pitch") {
    lines.push(
      `I’m reaching out as part of LECIPM’s ${market} rollout. We combine BNHub short-term tools with residential brokerage rails so clients aren’t juggling five disconnected apps.`
    );
    lines.push(
      `Pricing is configuration-driven: you’ll see fee breakdowns before guests pay, and broker lead economics default to a published pay-per-lead anchor (~$${leadCad} CAD unless your contract differs).`
    );
    lines.push(`If helpful, I can share a screen recording or a live walkthrough — no automated follow-ups without consent.`);
  } else if (req.channel === "dm") {
    lines.push(`Hey — I’m with LECIPM (${market}). We’re onboarding ${who}s who want transparent fees + Stripe checkout. Open to a 15m call?`);
  } else if (req.channel === "email") {
    lines.push(`Subject: ${market} — LECIPM transparent fees + BNHub + brokerage`);
    lines.push("");
    lines.push(`Hi —`);
    lines.push(
      `Quick intro: LECIPM is a Québec-first platform for stays (BNHub) and residential deal workflows. Nothing here promises savings versus OTAs — we show line-item fees and keep humans in the loop for compliance.`
    );
    lines.push(`If you’re open, reply with a good time for a short call.`);
  } else {
    lines.push(`Call opener: Thanks for taking the call — I’ll keep this factual.`);
    lines.push(
      `LECIPM publishes fee structures in-product; I’m not going to quote competitor rates because we don’t scrape them. I can show our host plans and BNHub checkout breakdown on a sample listing.`
    );
    lines.push(`Discovery: What’s your current stack for payouts and compliance?`);
    lines.push(`Close: Happy to send a written summary and schedule a follow-up — no pressure today.`);
  }

  if (req.bullets?.length) {
    lines.push("");
    lines.push("Notes you asked to emphasize:");
    for (const b of req.bullets.slice(0, 6)) lines.push(`• ${b}`);
  }

  return {
    title: `${req.segment} · ${req.channel}`,
    body: lines.join("\n\n"),
    reviewRequired: true,
  };
}
