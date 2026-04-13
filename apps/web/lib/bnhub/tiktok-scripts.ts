/**
 * BNHUB → TikTok: short-form scripts, captions, and hashtags from listing facts only.
 * Uses OpenAI when configured; otherwise deterministic copy (no invented amenities or prices).
 *
 * Story beat order (every script):
 * HOOK (first ~2s) → VISUAL (images/video) → VALUE (price / features) → CTA (link in bio).
 */

import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

export type TikTokListingInput = {
  title: string;
  /** Nightly rate in major units (e.g. CAD dollars), not cents */
  price_per_night: number;
  city: string;
  /** Public image URLs or site-relative paths — used as “what to film” hints only */
  images: string[];
};

export type TikTokScriptStyle =
  | "price_shock"
  | "lifestyle"
  | "comparison"
  | "question"
  | "hidden_gem";

export type TikTokScriptBlock = {
  style: TikTokScriptStyle;
  /** HOOK — first ~2s (voice + on-screen text) */
  hook: string;
  /** VISUAL — b-roll, cuts, which images (not the value pitch yet) */
  middle: string;
  /** VALUE — nightly price + honest feature callouts (title/city only; no invented amenities) */
  value: string;
  /** CTA — link in bio / BNHUB */
  cta: string;
};

export type TikTokScriptsPayload = {
  scripts: TikTokScriptBlock[];
  captions: string[];
  hashtags: string[];
};

/** Alias for JSON responses / API docs */
export type TikTokScriptsResult = TikTokScriptsPayload;

/** Optional bias from the content optimization loop (winning styles + hook examples). */
export type TikTokScriptGenerationHints = {
  prioritizedStyles?: TikTokScriptStyle[];
  hookExamples?: string[];
};

const STYLES_ORDER: TikTokScriptStyle[] = [
  "price_shock",
  "lifestyle",
  "comparison",
  "question",
  "hidden_gem",
];

/** Merge optimization priority with the full style set so every style appears exactly once. */
export function mergeStyleOrder(priority: TikTokScriptStyle[]): TikTokScriptStyle[] {
  const seen = new Set<TikTokScriptStyle>();
  const out: TikTokScriptStyle[] = [];
  for (const s of priority) {
    if (STYLES_ORDER.includes(s) && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  for (const s of STYLES_ORDER) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

function reorderPackByStylePriority(
  payload: TikTokScriptsPayload,
  hints?: TikTokScriptGenerationHints | null
): TikTokScriptsPayload {
  if (!hints?.prioritizedStyles?.length) return payload;
  const order = mergeStyleOrder(hints.prioritizedStyles);
  const byStyle = new Map(
    payload.scripts.map((s, i) => [s.style, { script: s, caption: payload.captions[i] ?? "" }])
  );
  const newScripts: TikTokScriptBlock[] = [];
  const newCaptions: string[] = [];
  for (const st of order) {
    const pair = byStyle.get(st);
    if (!pair) return payload;
    newScripts.push(pair.script);
    newCaptions.push(pair.caption);
  }
  if (newScripts.length !== 5) return payload;
  const renumbered = newCaptions.map((c, i) => c.replace(/#\d+\/5/g, `#${i + 1}/5`));
  return { scripts: newScripts, captions: renumbered, hashtags: payload.hashtags };
}

function buildOptimizationPromptAddendum(hints?: TikTokScriptGenerationHints | null): string {
  if (!hints?.prioritizedStyles?.length && !hints?.hookExamples?.length) return "";
  const order = mergeStyleOrder(hints.prioritizedStyles ?? []);
  const parts: string[] = [
    `Output scripts[] in this exact style order (one object per style, index 0 = first style listed): ${order.join(", ")}.`,
  ];
  if (hints.hookExamples?.length) {
    parts.push(
      `The user JSON may include "optimization.winning_hook_examples_for_tone_only". Those are hooks from high-performing posts — match their energy, length, and rhetorical pattern for THIS listing only; paraphrase; do not copy other listings' specifics or invent amenities.`
    );
  }
  return "\n\nOptimization signals:\n" + parts.join("\n");
}

function formatCad(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: safe % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

function cityTag(city: string): string {
  return city
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("")
    .slice(0, 48) || "Travel";
}

function imageHint(images: string[], index: number): string {
  if (images.length === 0) return "b-roll of the space (film your own walkthrough)";
  const i = Math.min(index, images.length - 1);
  return `clip or still from image ${i + 1} of ${images.length}`;
}

function buildDeterministic(
  input: TikTokListingInput,
  hints?: TikTokScriptGenerationHints | null
): TikTokScriptsPayload {
  const { title, city, images, price_per_night } = input;
  const price = formatCad(price_per_night);
  const shortTitle = title.trim().slice(0, 80) || "This stay";
  const ct = cityTag(city);
  const img0 = imageHint(images, 0);
  const img1 = imageHint(images, 1);

  const valueBase = `${price}/night · ${shortTitle} · ${city}`;

  const scripts: TikTokScriptBlock[] = [
    {
      style: "price_shock",
      hook: `POV: you find a ${city} stay — wait for the number.`,
      middle: `0–2s: face or text-only tease. Then quick cuts: ${img0} → ${img1}. No price on screen until the VALUE beat.`,
      value: `On-screen: ${valueBase}. Hold 2–3s — this is the “shock” reveal.`,
      cta: `Book on BNHUB — link in bio. Tag someone who still overpays for hotels.`,
    },
    {
      style: "lifestyle",
      hook: `This is what ${price}/night feels like in ${city}.`,
      middle: `VISUAL only: slow “day in the life” — kettle, window light, one wide of the stay (${img0}). Chill audio.`,
      value: `Text overlay: ${valueBase}. Keep claims to what you show.`,
      cta: `Save this for your next trip — link in bio on LECIPM / BNHUB.`,
    },
    {
      style: "comparison",
      hook: `Hotel vs this place in ${city} — guess both prices.`,
      middle: `Split-screen: left = generic hotel vibe (stock or b-roll); right = your clips ${img0} → ${img1}. No fake competitor numbers.`,
      value: `Reveal: ${valueBase}. Whole unit vs. a room — honest framing only.`,
      cta: `Comment “STAY” — I’ll point you to the BNHUB listing (link in bio).`,
    },
    {
      style: "question",
      hook: `Would you pay ${price} a night for THIS in ${city}?`,
      middle: `First frame blurred or cropped; then reveal ${img0}. Poll sticker: Yes / Need more pics.`,
      value: `Flash ${valueBase} as the answer beat.`,
      cta: `Follow for more stays — book verified on BNHUB (link in bio).`,
    },
    {
      style: "hidden_gem",
      hook: `Nobody talks about this ${city} spot — "${shortTitle.slice(0, 40)}".`,
      middle: `Neighborhood + interior b-roll: ${img1}, one calm VO line. No invented “hidden” facts.`,
      value: `${valueBase} — gem because of price + whole place, not made-up awards.`,
      cta: `Grab dates on BNHUB — link in bio before weekends fill.`,
    },
  ];

  const captions: string[] = scripts.map((s, idx) => {
    const line = [s.hook, `✨ ${shortTitle}`, `📍 ${city}`, `${price}/night · BNHUB`].join("\n");
    return `${line}\n\n#${idx + 1}/5 ${s.style.replace("_", " ")}`;
  });

  const hashtags = [
    "BNHUB",
    "LECIPM",
    "ShortTermRental",
    "VacationRental",
    `${ct}Travel`,
    `${ct}Stay`,
    "CanadaTravel",
    "TravelTok",
    "AirbnbAlternative",
    "BookDirect",
    "Staycation",
    `${ct}Trip`,
    `${ct}Vacation`,
    "QuebecTravel",
    "TravelTips",
    "BudgetTravel",
  ].map((t) => (t.startsWith("#") ? t : `#${t.replace(/^#/, "")}`));

  return reorderPackByStylePriority({ scripts, captions, hashtags }, hints);
}

function parsePayload(raw: unknown): TikTokScriptsPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const scriptsRaw = o.scripts;
  const captionsRaw = o.captions;
  const hashtagsRaw = o.hashtags;
  if (!Array.isArray(scriptsRaw) || !Array.isArray(captionsRaw) || !Array.isArray(hashtagsRaw)) return null;
  if (scriptsRaw.length !== 5 || captionsRaw.length !== 5) return null;

  const scripts: TikTokScriptBlock[] = [];
  for (let i = 0; i < 5; i++) {
    const s = scriptsRaw[i];
    if (!s || typeof s !== "object") return null;
    const b = s as Record<string, unknown>;
    const style = b.style;
    const hook = b.hook;
    const middle = b.middle;
    const valueRaw = b.value;
    const cta = b.cta;
    if (typeof hook !== "string" || typeof middle !== "string" || typeof cta !== "string") return null;
    const value = typeof valueRaw === "string" ? valueRaw : "";
    const st = typeof style === "string" && STYLES_ORDER.includes(style as TikTokScriptStyle) ? style : STYLES_ORDER[i];
    scripts.push({
      style: st as TikTokScriptStyle,
      hook: hook.slice(0, 400),
      middle: middle.slice(0, 800),
      value: value.slice(0, 500),
      cta: cta.slice(0, 400),
    });
  }

  const captions = captionsRaw.map((c) => (typeof c === "string" ? c.slice(0, 2200) : ""));
  const hashtags = hashtagsRaw
    .filter((h): h is string => typeof h === "string")
    .map((h) => {
      const t = h.trim();
      if (!t) return "";
      return t.startsWith("#") ? t.slice(0, 120) : `#${t.replace(/^#+/, "").slice(0, 118)}`;
    })
    .filter(Boolean);

  if (captions.some((c) => !c)) return null;
  if (hashtags.length < 5) return null;

  return { scripts, captions, hashtags };
}

/** Map a BNHUB DB row shape to `TikTokListingInput` (photos JSON → image URLs). */
export function toTikTokListingInput(row: {
  title: string;
  city: string;
  nightPriceCents: number;
  photos?: unknown;
}): TikTokListingInput {
  const photos = Array.isArray(row.photos) ? row.photos.filter((x): x is string => typeof x === "string") : [];
  return {
    title: row.title,
    city: row.city,
    price_per_night: row.nightPriceCents / 100,
    images: photos,
  };
}

/**
 * Pretty-print one script with HOOK → VISUAL → VALUE → CTA labels (admin UI + `MachineGeneratedContent.script`).
 */
export function formatTikTokScriptSections(block: TikTokScriptBlock): string {
  const value =
    block.value?.trim() ||
    "On-screen: nightly rate + listing title + city — facts only; no invented amenities.";
  return [
    "HOOK (first ~2 sec)",
    block.hook.trim(),
    "",
    "VISUAL (images / video)",
    block.middle.trim(),
    "",
    "VALUE (price / features)",
    value,
    "",
    "CTA (link in bio)",
    block.cta.trim(),
  ].join("\n");
}

/**
 * Produce five TikTok-ready scripts (one per style), five matching captions, and a hashtag set.
 * Does not invent discounts, availability, or amenities not implied by the input.
 *
 * When `hints` are set (content optimization loop), style order follows winning styles and prompts
 * bias hooks toward high-performing patterns from the cohort.
 */
export async function generateTikTokScripts(
  listing: TikTokListingInput,
  hints?: TikTokScriptGenerationHints | null
): Promise<TikTokScriptsPayload> {
  const fallback = buildDeterministic(listing, hints);
  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    return fallback;
  }

  const imageNotes = listing.images.slice(0, 8).map((u, i) => `${i + 1}. ${String(u).slice(0, 200)}`);
  const styleOrderLine = hints?.prioritizedStyles?.length
    ? `Each of the 5 scripts must use exactly one of these styles, and scripts[] MUST follow this order (index 0 = first): ${mergeStyleOrder(hints.prioritizedStyles).join(", ")}.`
    : `Each of the 5 scripts must use exactly one of these styles in order: ${STYLES_ORDER.join(", ")}.`;

  const userPayload: Record<string, unknown> = {
    title: listing.title,
    price_per_night: listing.price_per_night,
    city: listing.city,
    images: imageNotes.length ? imageNotes : ["(no URLs — suggest generic b-roll)"],
    currency: "CAD",
  };
  if (hints?.prioritizedStyles?.length || hints?.hookExamples?.length) {
    userPayload.optimization = {
      prioritize_style_order: mergeStyleOrder(hints.prioritizedStyles ?? []),
      winning_hook_examples_for_tone_only: (hints.hookExamples ?? [])
        .slice(0, 12)
        .map((h) => h.slice(0, 200)),
    };
  }

  const systemBase = `You write TikTok / Reels voiceover scripts for BNHUB (LECIPM) short-term stays in Canada.

Story order for EVERY script (non-negotiable beats):
1) hook — first ~2 seconds only (on-screen + VO). Grab attention; do NOT dump price here unless the style needs one word of tease.
2) middle — VISUAL directions only: shots, transitions, which image index, b-roll. No long price sentences here.
3) value — VALUE beat: state nightly price (from input) + title/city + at most one honest feature implied by the title (e.g. "entire place") — never invent amenities, parking, views, or awards.
4) cta — CTA: link in bio / book on BNHUB / LECIPM. No fake URLs.

Rules:
- Use only facts from the JSON input (title, price_per_night, city, images). Do not invent amenities, awards, views, or discounts.
- ${styleOrderLine}
- Each scripts[] object MUST have keys: style, hook, middle, value, cta (all strings).
- Captions: array of exactly 5 strings, aligned index-wise with scripts (emoji ok, under ~900 chars each).
- Hashtags: flat array of 12–24 tags, each with leading #, relevant to travel + city + BNHUB; no spaces inside a tag.
- Output valid JSON only with keys: scripts, captions, hashtags.`;

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.55,
      max_tokens: 2600,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemBase + buildOptimizationPromptAddendum(hints),
        },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
    });

    const text = res.choices[0]?.message?.content?.trim();
    if (!text) return fallback;

    const parsed = JSON.parse(text) as unknown;
    const validated = parsePayload(parsed);
    if (validated) return reorderPackByStylePriority(validated, hints);
  } catch {
    /* fall through */
  }

  return fallback;
}
