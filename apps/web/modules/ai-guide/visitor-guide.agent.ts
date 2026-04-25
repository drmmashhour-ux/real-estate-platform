/**
 * Visitor guide — structured prompts, intent-aware tone, no manipulation or fake urgency.
 * Three-part output: Answer → Benefit → CTA (see RESPONSE_FORMULA).
 */

export type VisitorGuideSurface = "landing" | "dashboard";

/** Inferred for tone; not shown to the user. */
export type VisitorGuideIntent = "curious" | "skeptical" | "ready" | "neutral";

export type VisitorGuideContext = {
  surface: VisitorGuideSurface;
  userMessage: string;
  /** Last few user questions in this session (oldest first) — avoids repeating the same explanation. */
  lastUserMessages?: string[];
  /** 0-based turn index; rotates the suggested CTA line. */
  turnIndex?: number;
};

export type GuideReply = {
  reply: string;
  intent: VisitorGuideIntent;
  ctaUsed: string;
};

// —— Phase 1: prompt blocks —— //

export const SYSTEM_PROMPT = `You are the LECIPM visitor guide (Québec real estate broker focus).

Non-negotiables:
- Truthful and clear. No manipulation, no fake urgency, no exaggerated or guaranteed claims.
- Persuasive without being pushy. No hype, no pressure tactics.
- Simple language. No technical jargon. No false legal or regulatory promises.
- Prefer: clarity, "save time", "focus", "close faster" in a grounded way — not sales fluff.

You MUST follow the RESPONSE FORMULA exactly (see CONTEXT).`;

export const VALUE_PROMPT = `
Always reinforce this idea naturally (do not sound repetitive across turns if CONTEXT says the user already heard it):

* Brokers often waste time on the wrong leads.
* This platform helps them focus on deals that are more likely to move and tells them what to do next.
* Benefits to lean on: save time, close more of the right deals, reduce uncertainty about where to focus.
`.trim();

export const CTA_PROMPT = `
The reply MUST end (third part) with EXACTLY the "Selected CTA line" from CONTEXT, unless a one-word tweak is required for grammar. Do not add a different call-to-action.

Rotate mentally with the user: the Selected CTA is already chosen for this turn; use it as the closing line.
`.trim();

export const RESPONSE_FORMULA = `
Every reply MUST use exactly three short parts, in order, separated by a blank line (two newlines between parts):

1) ANSWER — Directly address what they asked (1–2 short sentences).
2) BENEFIT — Connect to: less wasted time, clearer focus, or knowing what to do next (1–2 short sentences). Stay honest.
3) CTA — One short sentence using the exact Selected CTA line from CONTEXT.
`.trim();

// —— Phase 8: CTA rotation —— //

const CTA_LINES = [
  "Want to try it with real leads?",
  "Want to see your top deals first?",
  "Start with one lead and see the difference.",
] as const;

export function pickRotatedCta(turnIndex: number): string {
  const i = ((turnIndex ?? 0) % CTA_LINES.length + CTA_LINES.length) % CTA_LINES.length;
  return CTA_LINES[i] ?? CTA_LINES[0]!;
}

// —— Phase 4: intent —— //

export function inferIntent(message: string): VisitorGuideIntent {
  const t = message.toLowerCase();
  if (
    /\b(skeptic|doubt|scam|waste|not sure|unsure|already have|don't need|do not need)\b/i.test(t) ||
    t.includes("already have a crm") ||
    t.includes("i already have")
  ) {
    return "skeptical";
  }
  if (
    /\b(sign up|signup|get started|start now|try it|onboard|register|book)\b/i.test(t) ||
    (t.includes("how do i start") && t.length < 80)
  ) {
    return "ready";
  }
  if (/\b(what is|how does|why|explain|who is|tell me about)\b/i.test(t) || t.includes("?")) {
    return "curious";
  }
  return "neutral";
}

function intentToToneLine(intent: VisitorGuideIntent): string {
  switch (intent) {
    case "curious":
      return "Tone: educational — explain plainly, no sales pressure.";
    case "skeptical":
      return "Tone: reassuring — acknowledge the concern, stay factual, no defensiveness.";
    case "ready":
      return "Tone: action-oriented — short, concrete next step; still honest.";
    default:
      return "Tone: balanced and helpful.";
  }
}

// —— Phase 6: objection handling —— //

function tryObjectionResponse(message: string, surface: VisitorGuideSurface, cta: string): GuideReply | null {
  const t = message.toLowerCase();
  if (t.includes("already have a crm") || (t.includes("crm") && t.includes("already"))) {
    return {
      intent: "skeptical",
      ctaUsed: cta,
      reply: `LECIPM isn’t here to replace your CRM — it helps you decide what to do next with the leads and deals you already have.\n\nSo you spend less time guessing who to call first and more time on work that can actually close.\n\n${cta}`,
    };
  }
  if (t.includes("not sure") || t.includes("unsure") || t.includes("i'm not sure") || t.includes("im not sure")) {
    return {
      intent: "skeptical",
      ctaUsed: cta,
      reply: `That’s a fair way to feel — most brokers want to see it once on a real file before changing habits.\n\nYou can start with a single lead: you’ll see how priority and “what’s next” look without a big commitment.\n\n${cta}`,
    };
  }
  return null;
}

// —— Phase 1: context block —— //

function buildContextPrompt(args: {
  surface: VisitorGuideSurface;
  lastUserMessages: string[];
  currentMessage: string;
  intent: VisitorGuideIntent;
  selectedCta: string;
}): string {
  const { surface, lastUserMessages, currentMessage, intent, selectedCta } = args;
  const surfaceLine =
    surface === "landing" ?
      "Context: Public marketing page — emphasize who it’s for and the core value in plain words."
    : "Context: Logged in — focus on how to use the app day to day and where to see priorities and next steps.";

  const prev = lastUserMessages.filter((m) => m.trim() && m.trim() !== currentMessage.trim());
  const recent = prev.slice(-2);
  const noRepeat =
    recent.length > 0 ?
      `The user’s recent questions (paraphrase if needed; do NOT repeat the same explanation — add a new angle or example):\n${recent.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n`
    : "This may be the first message in the thread.\n";

  return `
${surfaceLine}

${noRepeat}
User intent: ${intent}. ${intentToToneLine(intent)}

Current user message: ${currentMessage}

Selected CTA line (use as the full third part, verbatim):
${selectedCta}

${RESPONSE_FORMULA}
`.trim();
}

// —— Canned 3-part fallbacks (no API) —— //

function cannedResponse(ctx: VisitorGuideContext, cta: string, intent: VisitorGuideIntent): GuideReply {
  const ob = tryObjectionResponse(ctx.userMessage, ctx.surface, cta);
  if (ob) return ob;

  const s = ctx.surface;
  const q = ctx.userMessage.toLowerCase();

  const answerBenefit = (a: string, b: string) => `${a}\n\n${b}\n\n${cta}`;

  if (q.includes("what is") || q.includes("platform")) {
    return {
      intent: intent === "neutral" ? "curious" : intent,
      ctaUsed: cta,
      reply: answerBenefit(
        "LECIPM is built for busy brokers: it highlights which inquiries and deals deserve your focus right now, instead of a flat list of names.",
        "The benefit is time back and less second-guessing — you work the opportunities that are more likely to go somewhere, with a clearer “what to do next.”",
      ),
    };
  }
  if (q.includes("lead") || q.includes("get leads")) {
    return {
      intent,
      ctaUsed: cta,
      reply: answerBenefit(
        "You connect your real pipeline in one place, then the product helps you see who to touch first and what step makes sense next — it’s not about buying random leads in bulk.",
        "You save time by cutting noise: fewer dead-end chases, more of the work that can actually close.",
      ),
    };
  }
  if (q.includes("ai")) {
    return {
      intent,
      ctaUsed: cta,
      reply: answerBenefit(
        "The AI is there to support decisions: what looks warm, what might be stuck, and a sensible next action — you stay in control and OACIQ rules still sit with you.",
        "In practice, that means less manual triage and more focus on a smaller set of high-leverage follow-ups.",
      ),
    };
  }
  if (q.includes("start") || q.includes("try")) {
    return {
      intent: "ready",
      ctaUsed: cta,
      reply: answerBenefit(
        s === "dashboard" ?
          "From your workspace, open your lead or deal list and pick the top-priority item — the product is meant to be useful on a single real file, not a long setup."
        : "Create a broker account, finish onboarding, and connect one real lead or deal. That is the fastest way to see if the priority view matches how you work.",
        "You get immediate signal on what to do next, instead of a blank CRM screen to figure out on your own.",
      ),
    };
  }

  return {
    intent,
    ctaUsed: cta,
    reply: answerBenefit(
      "LECIPM is about focus: you see which opportunities line up with your time and which ones to park — without promising outcomes you can’t control.",
      s === "dashboard" ?
        "On a busy day, that means you close faster in the sense of “fewer wrong tasks,” not magic guarantees."
      : "For most brokers, the win is time saved and less uncertainty on who to work first.",
    ),
  };
}

/**
 * Main entry: three-part reply, intent, rotated CTA. Respects last messages to reduce repetition in LLM path.
 */
export async function generateGuideResponse(ctx: VisitorGuideContext): Promise<GuideReply> {
  const lastUserMessages = ctx.lastUserMessages?.filter(Boolean) ?? [];
  const turn = ctx.turnIndex ?? 0;
  const cta = pickRotatedCta(turn);
  const intent = inferIntent(ctx.userMessage);
  const msg = ctx.userMessage.trim() || "What is LECIPM in simple terms?";

  const ob = tryObjectionResponse(msg, ctx.surface, cta);
  if (ob) return ob;

  const { openai, isOpenAiConfigured } = await import("@/lib/ai/openai");
  if (!isOpenAiConfigured() || !openai) {
    return cannedResponse({ ...ctx, userMessage: msg }, cta, intent);
  }

  const contextBlock = buildContextPrompt({
    surface: ctx.surface,
    lastUserMessages: lastUserMessages.slice(-4),
    currentMessage: msg,
    intent,
    selectedCta: cta,
  });

  const systemContent = [SYSTEM_PROMPT, "", "VALUE (weave in naturally, avoid repeating prior angles):", VALUE_PROMPT, "", CTA_PROMPT, "", contextBlock].join(
    "\n"
  );

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    max_tokens: 320,
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: msg },
    ],
  });

  let text = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!text) {
    return cannedResponse({ ...ctx, userMessage: msg }, cta, intent);
  }

  // Ensure CTA line present (soft repair if model forgot)
  if (!text.toLowerCase().includes(cta.replace(/[.?!]$/, "").toLowerCase().slice(0, 12))) {
    text = `${text}\n\n${cta}`;
  }

  return { reply: text, intent, ctaUsed: cta };
}

/** Static footer for UI when you want a default line without a server round-trip. */
export function getConversionCtaMessage(surface: VisitorGuideSurface, turnIndex = 0): string {
  return surface === "landing" ?
      `${pickRotatedCta(turnIndex)} Create a broker account when you are ready and connect one real file.`
    : `${pickRotatedCta(turnIndex)} Open your top-priority item in the app and follow the suggested next step.`;
}

export { pickRotatedCta, CTA_LINES };
