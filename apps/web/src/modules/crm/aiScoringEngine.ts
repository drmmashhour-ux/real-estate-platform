import type { LeadScoringContext } from "./crmExecutionTypes";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Interest from views, CTAs, inquiry body, chat depth. */
export function computeIntentScore(ctx: LeadScoringContext): number {
  let s = 0;
  s += Math.min(35, ctx.listingViews * 4);
  s += Math.min(25, ctx.ctaClicks * 8);
  if (ctx.messageLength > 40) s += 15;
  if (ctx.messageLength > 200) s += 10;
  s += Math.min(20, ctx.crmChatUserTurns * 5);
  if (ctx.bookingStarted) s += 20;
  if (ctx.bookingConfirmed) s += 25;
  if (ctx.highIntentFlag) s += 12;
  return clamp(s);
}

/** Recency + repeat engagement. */
export function computeUrgencyScore(ctx: LeadScoringContext): number {
  let s = 20;
  if (ctx.lastEventAt) {
    const hours = (Date.now() - ctx.lastEventAt.getTime()) / 36e5;
    if (hours < 1) s += 40;
    else if (hours < 6) s += 30;
    else if (hours < 24) s += 18;
    else if (hours < 72) s += 8;
    else s -= 10;
  }
  if (ctx.listingViews >= 3) s += 12;
  if (ctx.ctaClicks >= 2) s += 10;
  if (ctx.bookingStarted && !ctx.bookingConfirmed) s += 25;
  return clamp(s);
}

/** Verified account + broker link + consistent progression. */
export function computeTrustScore(ctx: LeadScoringContext): number {
  let s = 35;
  if (ctx.accountActive) s += 25;
  if (ctx.hasIntroducedBroker || ctx.hasAssignedExpert) s += 25;
  if (ctx.bookingConfirmed) s += 15;
  return clamp(s);
}

/** Abandoned flows and confusion proxies. */
export function computeFrictionScore(ctx: LeadScoringContext): number {
  let s = 15;
  if (ctx.bookingStarted && !ctx.bookingConfirmed) s += 35;
  if (ctx.ctaClicks > 0 && ctx.listingViews > 5 && !ctx.hasIntroducedBroker && ctx.crmChatUserTurns === 0) {
    s += 15;
  }
  if (ctx.lastEventAt) {
    const days = (Date.now() - ctx.lastEventAt.getTime()) / 864e5;
    if (days > 3 && computeIntentScore(ctx) > 50) s += 20;
  }
  return clamp(s);
}

/** Weighted priority for operational queue (higher = act now). */
export function computePriorityScore(parts: {
  intent: number;
  urgency: number;
  trust: number;
  friction: number;
}): number {
  const antiFriction = 100 - parts.friction;
  const raw =
    parts.intent * 0.35 + parts.urgency * 0.3 + antiFriction * 0.2 + parts.trust * 0.15;
  return clamp(raw);
}
