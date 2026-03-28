import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

const TEMPLATES: Array<{
  templateKey: string;
  segment: string;
  content: string;
  ctaType: string;
  tone?: string;
}> = [
  {
    templateKey: "handoff_ack",
    segment: "system",
    ctaType: "human",
    content: "Thanks — I'm getting this in front of the right person now so they can help you properly.",
  },
  {
    templateKey: "ghosting_follow_up",
    segment: "buyer",
    ctaType: "reply_yes",
    content:
      "Just a quick check-in — if you're still interested, I can help you move forward or show you similar options.",
  },
  {
    templateKey: "closing_push",
    segment: "buyer",
    ctaType: "reply_yes",
    content:
      "Based on what you're looking for, this seems like a strong option.\n\nI'd recommend moving forward now so you don't miss it — would you like help completing the next step?",
  },
  {
    templateKey: "closing_nudge",
    segment: "buyer",
    ctaType: "reply_yes",
    content:
      "Just a quick follow-up — this type of listing usually gets taken quickly.\n\nIf you're still interested, I can help you secure it now.",
  },
  {
    templateKey: "assist_close",
    segment: "booking",
    ctaType: "booking",
    content: "If you want, I can help you complete this now — it takes less than a minute.",
  },
  {
    templateKey: "next_step_call",
    segment: "buyer",
    ctaType: "call",
    content: "I can help with the next step quickly. Would you like me to arrange a quick call?",
  },
  {
    templateKey: "trust_with_action",
    segment: "buyer",
    ctaType: "reply_yes",
    content:
      "Good question — everything is shown clearly before you confirm, and payments are processed securely through Stripe. If you want, I can help you complete the next step now.",
  },
  {
    templateKey: "timing_with_action",
    segment: "buyer",
    ctaType: "reply_yes",
    content:
      "That makes sense. If you want, we can do the next step together now so you don't lose the opportunity.",
  },
  {
    templateKey: "buyer_interest_open",
    segment: "buyer",
    ctaType: "inquiry",
    content:
      "Hi {{name}}, I saw your interest in {{listing_title}}. What matters most to you right now: price, location, or timing?",
  },
  {
    templateKey: "buyer_price_objection",
    segment: "buyer",
    ctaType: "compare",
    content:
      "That makes sense — a lot of people compare at this stage. Are you weighing this against similar homes nearby, or mainly the monthly payment?",
  },
  {
    templateKey: "buyer_trust_objection",
    segment: "buyer",
    ctaType: "reply_yes",
    content:
      "Good question — the details are shown clearly before you move forward, and I can help clarify anything that feels uncertain. What part would you like me to explain?",
  },
  {
    templateKey: "buyer_timing_objection",
    segment: "buyer",
    ctaType: "call",
    content:
      "Of course. Just so you don't miss a strong option, would you prefer I help you compare similar listings now or set up a quick next step?",
  },
  {
    templateKey: "buyer_uncertainty",
    segment: "buyer",
    ctaType: "reply_yes",
    content:
      "Totally understandable. What's the main thing you're unsure about right now: price, location, or timing?",
  },
  {
    templateKey: "booking_interest_open",
    segment: "booking",
    ctaType: "booking",
    content:
      "Hi {{name}}, I saw you were looking at {{listing_title}}. If you'd like, I can help you move forward quickly — what are you mainly comparing right now: price, location, or flexibility?",
  },
  {
    templateKey: "booking_price_objection",
    segment: "booking",
    ctaType: "compare",
    content:
      "That's fair. Are you comparing total price, fees, or similar stays nearby? Tell me which matters most and I'll help you shortlist quickly.",
  },
  {
    templateKey: "booking_trust_objection",
    segment: "booking",
    ctaType: "reply_yes",
    content:
      "Completely understandable. Payments are processed securely through Stripe, and the booking details are shown before confirmation. What part feels unclear right now?",
  },
  {
    templateKey: "booking_timing_objection",
    segment: "booking",
    ctaType: "booking",
    content:
      "Of course. If this is the one you prefer, I'd recommend moving forward soon so you don't lose it. Would you like help completing the next step now?",
  },
  {
    templateKey: "booking_uncertainty",
    segment: "booking",
    ctaType: "reply_yes",
    content:
      "That makes sense. What's the main thing holding you back right now: trust, price, or timing?",
  },
  {
    templateKey: "broker_recruitment_open",
    segment: "broker",
    ctaType: "call",
    content:
      "Hi {{name}} — we're onboarding a small group of brokers on LECIPM for more visibility and qualified leads. Would a quick 15-minute call this week work to walk through how leads show up?",
  },
  {
    templateKey: "host_recruitment_open",
    segment: "host",
    ctaType: "inquiry",
    content:
      "Hi {{name}} — we're opening BNHub to a small host group in {{city}} to test real bookings end-to-end. Want to start with one listing and keep setup simple?",
  },
  {
    templateKey: "generic_clarify",
    segment: "buyer",
    ctaType: "reply_yes",
    content:
      "Thanks, {{name}} — quick question: what are you mainly looking for right now — a place to live, to invest, or just exploring?",
  },
  {
    templateKey: "silent_follow_up",
    segment: "buyer",
    ctaType: "reply_yes",
    content:
      "Just a quick check-in — if you're still interested, I can help you move forward or show you similar options.",
  },
];

/** intent, objection (null = default for intent), templateKey */
const RULE_ROWS: Array<{ intent: string; objection: string | null; templateKey: string }> = [
  { intent: "buyer_interest", objection: "price", templateKey: "buyer_price_objection" },
  { intent: "buyer_interest", objection: "trust", templateKey: "buyer_trust_objection" },
  { intent: "buyer_interest", objection: "timing", templateKey: "buyer_timing_objection" },
  { intent: "buyer_interest", objection: "uncertainty", templateKey: "buyer_uncertainty" },
  { intent: "buyer_interest", objection: null, templateKey: "buyer_interest_open" },
  { intent: "booking_interest", objection: "price", templateKey: "booking_price_objection" },
  { intent: "booking_interest", objection: "trust", templateKey: "booking_trust_objection" },
  { intent: "booking_interest", objection: "timing", templateKey: "booking_timing_objection" },
  { intent: "booking_interest", objection: "uncertainty", templateKey: "booking_uncertainty" },
  { intent: "booking_interest", objection: null, templateKey: "booking_interest_open" },
  { intent: "broker_interest", objection: null, templateKey: "broker_recruitment_open" },
  { intent: "host_interest", objection: null, templateKey: "host_recruitment_open" },
  { intent: "support_issue", objection: null, templateKey: "handoff_ack" },
  { intent: "unclear", objection: null, templateKey: "generic_clarify" },
];

export type SeedAutoReplyResult = { templatesUpserted: number; rulesCreated: number };

export async function seedAutoReplySystem(): Promise<SeedAutoReplyResult> {
  let templatesUpserted = 0;
  for (const t of TEMPLATES) {
    await prisma.autoReplyTemplate.upsert({
      where: { templateKey: t.templateKey },
      create: {
        id: randomUUID(),
        templateKey: t.templateKey,
        segment: t.segment,
        content: t.content,
        ctaType: t.ctaType,
        tone: t.tone ?? "helpful",
      },
      update: {
        segment: t.segment,
        content: t.content,
        ctaType: t.ctaType,
        tone: t.tone ?? "helpful",
      },
    });
    templatesUpserted++;
  }

  await prisma.autoReplyRule.deleteMany({});

  await prisma.autoReplyRule.createMany({
    data: RULE_ROWS.map((r) => ({
      id: randomUUID(),
      intent: r.intent,
      objection: r.objection,
      stage: null,
      templateKey: r.templateKey,
      isActive: true,
    })),
  });

  return { templatesUpserted, rulesCreated: RULE_ROWS.length };
}
