import type { ScriptContext, SalesScriptCategory, SalesScriptVm } from "./sales-script.types";
import { applyScriptVariant } from "./sales-script-variants.service";

const REP_REMINDER =
  "Stay factual: describe the product you can show today. Do not promise results you cannot verify on the call.";

function replaceName(line: string, name?: string) {
  if (!name?.trim()) return line.replace("[Name]", "there");
  return line.replace(/\[Name\]/g, name.trim());
}

const BROKER_COLD_BASE: SalesScriptVm = {
  id: "cold_call_broker",
  audience: "BROKER",
  title: "Broker — cold call",
  opening_line:
    "Hi, is this [Name]? — I’ll be quick. I work with a platform that is already generating real buyer leads in your area.",
  hook: "We’re not another listing site — we send brokers ready-to-engage clients.",
  value_proposition:
    "Instead of waiting for listings to convert, you receive direct opportunities from active users.",
  discovery_questions: [
    "Are you currently receiving enough qualified leads?",
    "What’s your main source of clients today?",
  ],
  objection_handling: [
    {
      when: "not interested",
      line: "I understand — most brokers say that until they see the quality of leads. That’s exactly why we let you start with no risk.",
    },
    {
      when: "already have leads",
      line: "That’s great — we don’t replace your system, we add a second stream of clients.",
    },
  ],
  closing_line: "Let me show you how it works — it takes 5 minutes. When are you free today or tomorrow?",
  fallback_lines: [
    "If now’s not ideal, what’s a better 10-minute window this week?",
    "I can send a one-pager and we can book 5 minutes when you’ve had a look — what email works?",
  ],
  rep_reminder: REP_REMINDER,
};

const BROKER_FOLLOWUP_BASE: SalesScriptVm = {
  id: "follow_up_broker",
  audience: "BROKER",
  title: "Broker — follow up",
  opening_line: "Hi [Name] — quick follow-up from LECIPM. I left a message about direct buyer opportunities in your market.",
  hook: "I’m not checking in to add noise — I want to see if a 5-minute walkthrough still makes sense.",
  value_proposition: "We connect you to users who are already active in the product, not cold internet traffic.",
  discovery_questions: [
    "Did you get a chance to look at what I sent?",
    "What would you need to see to say yes to a short demo?",
  ],
  objection_handling: [
    { when: "too busy", line: "Totally fair — I can do Thursday 4:00 or Friday 9:00, your pick, same 5 minutes." },
    { when: "send email", line: "I will — and I’ll include a 2-minute Loom. If it resonates, we book 5 minutes. Sound fair?" },
  ],
  closing_line: "Can I put 5 minutes on your calendar today or tomorrow — which side of the day is calmer for you?",
  fallback_lines: ["Want me to text you a link to book instead of guessing times?"],
  rep_reminder: REP_REMINDER,
};

const BROKER_DEMO_BOOKING_BASE: SalesScriptVm = {
  id: "demo_booking_broker",
  audience: "BROKER",
  title: "Broker — book demo",
  opening_line: "Hi [Name] — great news: we can walk you through live lead routing and CRM handoff in about 10 minutes.",
  hook: "You’ll see exactly how inbound interest maps to your workflow — no slides-only pitch.",
  value_proposition:
    "You leave knowing how alerts, assignments, and marketplace visibility work together for your brokerage.",
  discovery_questions: [
    "Who else should join if we book — you solo or someone from ops?",
    "Do you prefer screenshare mornings or afternoons?",
  ],
  objection_handling: [
    { when: "need colleague", line: "Perfect — pick a slot that fits both of you and I’ll send a calendar invite." },
    { when: "which toolstack", line: "We’ll map to how you already work — the demo is concrete, not theoretical." },
  ],
  closing_line:
    "I’m sending an invite — reply with two times that work this week and I’ll lock the earlier one.",
  fallback_lines: ["If calendar is tight, I’ll hold two optional slots — you confirm one."],
  rep_reminder: REP_REMINDER,
};

const BROKER_CLOSING_BASE: SalesScriptVm = {
  id: "closing_broker",
  audience: "BROKER",
  title: "Broker — closing next step",
  opening_line:
    "Hi [Name] — we’ve walked the product; I want to agree the clean next step so you’re not stuck in pilot limbo.",
  hook: "The shortest path is a small scoped start you can evaluate with real inbound in your lane.",
  value_proposition:
    "We focus on activating your marketplace presence and alerts so you can judge quality on facts, not promises.",
  discovery_questions: ["What decision do you still need internally — pricing, logistics, or timing?", "Who signs off?"],
  objection_handling: [
    { when: "need partner approval", line: "Let’s book a 15-minute include-your-partner session — same live product tour." },
    { when: "budget", line: "We’ll align tier to usage — tell me guardrails and I’ll reflect the smallest viable start." },
  ],
  closing_line: "If everything we showed checks out, can we start with the scoped package on Monday — yes or small tweak?",
  fallback_lines: ["Would a written one-page recap help your partner approve — I’ll draft tonight."],
  rep_reminder: REP_REMINDER,
};

const INVESTOR_PITCH_BASE: SalesScriptVm = {
  id: "pitch_investor",
  audience: "INVESTOR",
  title: "Investor — pitch",
  opening_line:
    "Hi — I’ll be quick — I’m building a real estate platform that combines marketplace, AI, and automation.",
  hook: "This is not just listings — it’s a system that generates revenue across multiple real estate streams.",
  value_proposition:
    "We’re structuring monetization across bookings, broker leads, subscriptions, and services — prioritizing disciplined execution.",
  pitch_points: [
    "transactions",
    "short-term rentals",
    "broker marketplace",
    "investor tools",
    "AI optimization",
  ],
  discovery_questions: [
    "Do you currently invest in real estate or tech platforms?",
    "What kind of opportunities are you looking for right now?",
  ],
  objection_handling: [
    { when: "too early", line: "Fair — we can keep it high-level today and revisit when you’re actively allocating." },
    { when: "metrics", line: "I’ll show what we measure in-product and our reporting exports — diligence-friendly, no hype slides." },
  ],
  closing_line:
    "I’d like to show you the live system — it will make much more sense visually. Are you available this week?",
  fallback_lines: ["Happy to send a deck outline first — prefer email or LinkedIn?"],
  rep_reminder:
    `${REP_REMINDER} Use verified metrics only; label estimates clearly.`,
};

const INVESTOR_COLD_BASE: SalesScriptVm = {
  ...INVESTOR_PITCH_BASE,
  id: "cold_call_investor",
  title: "Investor — cold outreach",
  opening_line:
    "Hi — I’ll be brief. I’m with LECIPM — we’re building a multi-hub real estate OS with marketplace and AI layers.",
  hook: INVESTOR_PITCH_BASE.hook,
  value_proposition: INVESTOR_PITCH_BASE.value_proposition,
};

const INVESTOR_FOLLOWUP_BASE: SalesScriptVm = {
  ...INVESTOR_PITCH_BASE,
  id: "follow_up_investor",
  title: "Investor — follow up",
  opening_line:
    "Hi — following up on LECIPM. I’m happy to keep this factual: product tour, metrics exports, and roadmap — no fluff.",
  hook: "You asked for time — here’s the shortest path to see the live hubs and revenue surfaces.",
  value_proposition:
    "We’ll walk BNHub-style bookings, broker CRM traction hooks, and investor reporting in one sitting.",
};

const INVESTOR_CLOSING_BASE: SalesScriptVm = {
  ...INVESTOR_PITCH_BASE,
  id: "closing_investor",
  title: "Investor — closing",
  opening_line:
    "Hi — we’ve covered the platform and diligence posture. I want to align on interest level and next diligence step.",
  hook: "No pressure narrative — just clarity on whether a deeper session or intro to our finance lead makes sense.",
  value_proposition:
    "Everything we discussed is observable in-product or in exports — we avoid hand-wavy market size claims.",
  closing_line:
    "Are you open to a 45-minute technical + metrics session this week — or prefer written follow-up first?",
};

function hydrate(vm: SalesScriptVm, ctx: ScriptContext): SalesScriptVm {
  const name = ctx.contactName;
  return {
    ...vm,
    opening_line: replaceName(vm.opening_line, name),
    discovery_questions: vm.discovery_questions.map((q) => replaceName(q, name)),
    closing_line: replaceName(vm.closing_line, name),
    fallback_lines: vm.fallback_lines.map((l) => replaceName(l, name)),
  };
}

export function generateBrokerColdCallScript(ctx: ScriptContext) {
  return applyScriptVariant(hydrate(BROKER_COLD_BASE, ctx), ctx);
}

export function generateBrokerFollowUpScript(ctx: ScriptContext) {
  return applyScriptVariant(hydrate(BROKER_FOLLOWUP_BASE, ctx), ctx);
}

/** Demo scheduling emphasis */
export function generateBrokerDemoBookingScript(ctx: ScriptContext) {
  return applyScriptVariant(hydrate(BROKER_DEMO_BOOKING_BASE, ctx), ctx);
}

/** Next-step / pilot commitment */
export function generateBrokerClosingScript(ctx: ScriptContext) {
  return applyScriptVariant(hydrate(BROKER_CLOSING_BASE, ctx), ctx);
}

export function generateInvestorColdCallScript(ctx: ScriptContext) {
  return applyScriptVariant(hydrate(INVESTOR_COLD_BASE, ctx), ctx);
}

export function generateInvestorPitchScript(ctx: ScriptContext) {
  return applyScriptVariant(hydrate(INVESTOR_PITCH_BASE, ctx), ctx);
}

export function generateInvestorFollowUpScript(ctx: ScriptContext) {
  return applyScriptVariant(hydrate(INVESTOR_FOLLOWUP_BASE, ctx), ctx);
}

export function generateInvestorClosingScript(ctx: ScriptContext) {
  return applyScriptVariant(hydrate(INVESTOR_CLOSING_BASE, ctx), ctx);
}

export function getScriptByCategory(category: SalesScriptCategory, ctx: ScriptContext) {
  switch (category) {
    case "cold_call_broker":
      return generateBrokerColdCallScript(ctx);
    case "follow_up_broker":
      return generateBrokerFollowUpScript(ctx);
    case "demo_booking_broker":
      return generateBrokerDemoBookingScript(ctx);
    case "closing_broker":
      return generateBrokerClosingScript(ctx);
    case "cold_call_investor":
      return generateInvestorColdCallScript(ctx);
    case "pitch_investor":
      return generateInvestorPitchScript(ctx);
    case "follow_up_investor":
      return generateInvestorFollowUpScript(ctx);
    case "closing_investor":
      return generateInvestorClosingScript(ctx);
    default:
      throw new Error(`Unknown script category: ${String(category)}`);
  }
}
