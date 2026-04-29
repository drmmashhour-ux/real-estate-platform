/**
 * Host reply suggestions — rule-based by default; optional OpenAI assist (server-side only).
 *
 * ## Phase 1 — `getReplySuggestions(context)`
 *
 * **Input (`SybnbReplySuggestionContext`):** `lastGuestMessage`, **safe booking snapshot** only
 * (`status`, ISO dates, `nights`, `guests` — see {@link toSafeBookingSnapshot}), `locale`.
 *
 * ## Phase 2 — Rules (keyword → fixed copy, case-insensitive)
 *
 * | Keyword in guest message | EN suggestion |
 * |--------------------------|---------------|
 * | `price` | “The price is as listed…” |
 * | `available` | “Yes, the dates are available…” |
 * | `payment` | “We will arrange payment after approval.” |
 *
 * Arabic copy under {@link RULE_COPY.ar}. If nothing matches, generic neutral fallbacks (still no invention).
 *
 * ## Phase 3 — Optional AI (`SYBNB_CHAT_SUGGESTIONS_AI_ENABLED=true`)
 *
 * Safe prompt: 2 short replies, **do not invent facts**; booking facts listed as context-only; JSON `{"replies":[...]}`.
 *
 * ## Phases 5–6 — Safety
 *
 * Never auto-send; prompts exclude identities and sensitive fields — only the snapshot above + truncated guest text.
 *
 * **ChatBox** (Phase 4): chips insert into textarea only; host must press Send.
 */

export type SybnbReplySuggestionBookingSnapshot = {
  /** Booking workflow status only — no user identifiers. */
  status: string;
  checkInIso: string;
  checkOutIso: string;
  nights: number;
  guests: number;
};

export type SybnbReplySuggestionContext = {
  lastGuestMessage: string | null;
  booking: SybnbReplySuggestionBookingSnapshot;
  /** UI locale for rule strings and AI output language. */
  locale: "ar" | "en";
};

export type SybnbReplySuggestionsSource = "rules" | "ai" | "rules_ai";

export type SybnbReplySuggestionsResult = {
  suggestions: string[];
  source: SybnbReplySuggestionsSource;
};

const RULE_COPY = {
  en: {
    price: "The price is as listed. Let me know if you have questions.",
    available: "Yes, the dates are available. I can confirm your booking.",
    payment: "We will arrange payment after approval.",
  },
  ar: {
    price: "السعر كما هو معروض. أخبرني إن كان لديك أسئلة.",
    available: "نعم، التواريخ متاحة. يمكنني تأكيد حجزك.",
    payment: "سنرتّب الدفع بعد الموافقة.",
  },
} as const;

const GENERIC_FALLBACK = {
  en: [
    "Thanks for your message — I'll reply shortly.",
    "I'll review your note and get back to you.",
  ],
  ar: ["شكراً لرسالتك — سأرد قريباً.", "سأراجع ملاحظتك وأعود إليك."],
} as const;

/** Keyword → rule id (order preserved). */
const RULE_KEYWORDS: { kw: string; id: keyof (typeof RULE_COPY)["en"] }[] = [
  { kw: "price", id: "price" },
  { kw: "available", id: "available" },
  { kw: "payment", id: "payment" },
];

const MAX_GUEST_SNIPPET = 800;
const MAX_SUGGESTIONS = 5;

function normalizeLocale(raw: string | undefined): "ar" | "en" {
  const l = (raw ?? "en").trim().toLowerCase();
  return l.startsWith("ar") ? "ar" : "en";
}

export function resolveSuggestionLocale(raw: string | undefined): "ar" | "en" {
  return normalizeLocale(raw);
}

export function toSafeBookingSnapshot(input: {
  status: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
}): SybnbReplySuggestionBookingSnapshot {
  return {
    status: input.status,
    checkInIso: input.checkIn.toISOString().slice(0, 10),
    checkOutIso: input.checkOut.toISOString().slice(0, 10),
    nights: input.nights,
    guests: input.guests,
  };
}

function uniqSuggestions(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = raw.trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= MAX_SUGGESTIONS) break;
  }
  return out;
}

/**
 * Rule-based suggestions from the last guest message (keyword substring match, case-insensitive).
 */
export function collectRuleSuggestions(
  lastGuestMessage: string | null,
  locale: "ar" | "en",
): string[] {
  const text = (lastGuestMessage ?? "").toLowerCase();
  const copy = RULE_COPY[locale];
  const out: string[] = [];
  for (const { kw, id } of RULE_KEYWORDS) {
    if (text.includes(kw)) {
      out.push(copy[id]);
    }
  }
  return out;
}

export function genericFallbackSuggestions(locale: "ar" | "en"): string[] {
  return [...GENERIC_FALLBACK[locale]];
}

function isChatSuggestionsAiEnabled(): boolean {
  return process.env.SYBNB_CHAT_SUGGESTIONS_AI_ENABLED?.trim().toLowerCase() === "true";
}

function truncateGuestMessage(content: string): string {
  const t = content.trim().replace(/\s+/g, " ");
  return t.length <= MAX_GUEST_SNIPPET ? t : `${t.slice(0, MAX_GUEST_SNIPPET)}…`;
}

function parseAiRepliesJson(raw: string): string[] {
  const trimmed = raw.trim();
  const brace = trimmed.match(/\{[\s\S]*\}/);
  if (!brace) return [];
  try {
    const parsed = JSON.parse(brace[0]) as { replies?: unknown };
    if (!Array.isArray(parsed.replies)) return [];
    return parsed.replies
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
  } catch {
    return [];
  }
}

async function fetchOpenAiReplySuggestions(
  ctx: SybnbReplySuggestionContext,
): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return [];

  const guest = truncateGuestMessage(ctx.lastGuestMessage ?? "");
  const lang = ctx.locale === "ar" ? "Arabic" : "English";
  const { booking } = ctx;

  const userPrompt = [
    "Suggest exactly 2 short replies for a host in a short-term rental booking chat.",
    `Write in ${lang} only.`,
    "Rules:",
    "- Do not invent facts: no specific prices, totals, policies, or guarantees about availability unless the guest message clearly states them.",
    "- Do not mention names, emails, phone numbers, or payment credentials.",
    "- Keep each reply under 220 characters.",
    "- Be polite and neutral.",
    "",
    "Booking facts (context only — do not repeat as promises):",
    `- status: ${booking.status}`,
    `- stay_from_iso: ${booking.checkInIso}`,
    `- stay_to_iso: ${booking.checkOutIso}`,
    `- guests_count: ${booking.guests}`,
    `- nights: ${booking.nights}`,
    "",
    `Guest message (may be empty): ${guest || "(none)"}`,
    "",
    'Respond with JSON only in this shape: {"replies":["...","..."]}',
  ].join("\n");

  const model = process.env.SYBNB_CHAT_SUGGESTIONS_AI_MODEL?.trim() || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 350,
      messages: [
        {
          role: "system",
          content:
            "You help hosts draft short booking chat replies. Never invent prices, dates, or policies. Output valid JSON only.",
        },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    console.error("[sybnb-chat-suggestions] OpenAI HTTP", res.status);
    return [];
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) return [];

  return parseAiRepliesJson(text);
}

/**
 * Host-oriented reply suggestions: rules first, optional AI merge, generic fallbacks if empty.
 */
export async function getReplySuggestions(ctx: SybnbReplySuggestionContext): Promise<SybnbReplySuggestionsResult> {
  const locale = ctx.locale;
  const rules = collectRuleSuggestions(ctx.lastGuestMessage, locale);

  let ai: string[] = [];
  if (isChatSuggestionsAiEnabled()) {
    try {
      ai = await fetchOpenAiReplySuggestions(ctx);
    } catch (e) {
      console.error("[sybnb-chat-suggestions]", e instanceof Error ? e.message : e);
    }
  }

  const merged = uniqSuggestions([...rules, ...ai]);
  let source: SybnbReplySuggestionsSource = "rules";

  if (rules.length > 0 && ai.length > 0) {
    source = "rules_ai";
  } else if (rules.length === 0 && ai.length > 0) {
    source = "ai";
  }

  if (merged.length === 0) {
    return {
      suggestions: uniqSuggestions(genericFallbackSuggestions(locale)),
      source: "rules",
    };
  }

  return { suggestions: merged, source };
}
