import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import { formatContextForPrompt, type BrokerReplyContext } from "@/modules/messaging/ai/conversation-context";
import { logInfo, logError } from "@/lib/logger";

const TAG = "[ai-message]";

const MODEL = "gpt-4o-mini";

export type ReplyIntent = "follow_up" | "property" | "negotiation";

export type GeneratedReplySuggestion = {
  label: string;
  text: string;
};

export type GenerateReplySuggestionsResult = {
  source: "openai" | "template";
  suggestions: GeneratedReplySuggestion[];
};

const INTENT_HINT: Record<ReplyIntent, string> = {
  follow_up:
    "One option should be a short polite follow-up checking in and offering next steps.",
  property:
    "One option should explain property value drivers (space, condition, neighborhood) without inventing facts.",
  negotiation:
    "One option should move toward next steps (visit, offer framework) professionally without pressure.",
};

function offlineSuggestions(ctx: BrokerReplyContext, intent: ReplyIntent): GeneratedReplySuggestion[] {
  const listing = ctx.listingTitle?.trim();
  const opener = listing
    ? `Thanks for your interest in ${listing}.`
    : "Thanks for your message.";

  const base: GeneratedReplySuggestion[] = [
    {
      label: "Follow-up",
      text: `${opener} I can share recent comparables and help you evaluate fit — would a quick call this week work, or do you prefer messaging here?`,
    },
    {
      label: "Property context",
      text: `${opener} Happy to walk through what stands out about the home (layout, light, location) and answer questions so you can compare options confidently.`,
    },
    {
      label: "Next steps",
      text: `${opener} If you would like, I can arrange a visit and outline what an offer could look like — let me know your timing and any must-haves.`,
    },
  ];

  if (intent === "negotiation") {
    base[2] = {
      label: "Negotiation",
      text: `${opener} I can clarify seller expectations and typical contingencies in this market so you can decide on an approach that feels fair and practical.`,
    };
  } else if (intent === "property") {
    base[1] = {
      label: "Property detail",
      text: `${opener} I can summarize key facts from the listing and disclosure path, and flag anything worth verifying during a visit.`,
    };
  }

  return base;
}

export async function generateBrokerReplySuggestions(params: {
  ctx: BrokerReplyContext;
  intent?: ReplyIntent;
  locale?: "en" | "fr";
}): Promise<GenerateReplySuggestionsResult> {
  const intent = params.intent ?? "follow_up";
  const locale = params.locale ?? "en";
  const ctx = params.ctx;

  if (!isOpenAiConfigured() || !openai) {
    logInfo(`${TAG} suggestions.template`, { intent });
    return { source: "template", suggestions: offlineSuggestions(ctx, intent) };
  }

  const sys = [
    "You assist licensed Quebec real estate brokers using LECIPM.",
    "Produce exactly 3 short reply options for the broker to send to the client.",
    "Rules: professional, warm, compliant — no guarantees, no discrimination, no pressure tactics.",
    "Never invent property facts not implied by the transcript.",
    locale === "fr"
      ? "Write in Canadian French unless the transcript is clearly English-only."
      : "Write in the same primary language as the recent messages when obvious; otherwise Canadian English.",
    INTENT_HINT[intent],
    'Return JSON only: {"suggestions":[{"label":"...","text":"..."}]}',
  ].join("\n");

  const user = formatContextForPrompt(ctx);

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.6,
      max_tokens: 650,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error("empty completion");
    const parsed = JSON.parse(raw) as { suggestions?: GeneratedReplySuggestion[] };
    const list = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    const cleaned = list
      .filter((s) => s && typeof s.text === "string" && s.text.trim())
      .slice(0, 3)
      .map((s, i) => ({
        label: typeof s.label === "string" && s.label.trim() ? s.label.trim() : `Option ${i + 1}`,
        text: s.text.trim(),
      }));
    if (cleaned.length === 0) throw new Error("no suggestions");
    logInfo(`${TAG} suggestions.openai`, { count: cleaned.length, intent });
    return { source: "openai", suggestions: cleaned };
  } catch (e) {
    logError(`${TAG} openai`, e);
    return { source: "template", suggestions: offlineSuggestions(ctx, intent) };
  }
}
