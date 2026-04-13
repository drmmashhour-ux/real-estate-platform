import { openai, isOpenAiConfigured } from "@/lib/ai/openai";

/** Supported domains for `/api/ai/write`. */
export type WriterType = "listing" | "message" | "mortgage" | "general";

export type WriterAction =
  | "generate"
  | "professional"
  | "shorter"
  | "persuasive"
  | "translate_fr"
  | "translate_en"
  /** Spelling / grammar only — same language, preserve facts */
  | "correct_writing";

export type ListingContext = {
  propertyType?: string;
  location?: string;
  price?: string;
  features?: string;
};

const MODEL = "gpt-4o-mini";

function buildSystemPrompt(type: WriterType, action: WriterAction): string {
  const base = `You are a senior copywriter for LECIPM, a Quebec real estate marketplace (Montreal, Laval, BNHUB stays, mortgages).
Output only the requested text — no quotes, no preamble, no markdown code fences unless formatting clearly helps readability.`;

  if (action === "correct_writing") {
    return (
      `You proofread real-estate and legal disclosure text for a Quebec marketplace.\n` +
      `Fix spelling, grammar, punctuation, and capitalization only.\n` +
      `Keep the same language as the input (English or French, including Canadian French).\n` +
      `Do not change names, numbers, dates, addresses, dollar amounts, or factual claims.\n` +
      `Preserve paragraph breaks and list-like lines. Output only the corrected full text — no preamble or explanation.`
    );
  }

  if (action === "translate_fr") {
    return `${base}\nTranslate the user's text into natural Canadian French. Preserve meaning and tone.`;
  }
  if (action === "translate_en") {
    return `${base}\nTranslate the user's text into clear Canadian English. Preserve meaning.`;
  }

  switch (type) {
    case "listing":
      if (action === "generate") {
        return `${base}\nWrite a premium real estate listing in Montreal / Quebec with a confident, luxury-adjacent tone (not cheesy).
Use vivid but honest language. Include space, light, neighborhood vibe, and a subtle call to book / inquire.
Do not invent legal claims or guaranteed returns.`;
      }
      return `${base}\nImprove short-term rental / listing description copy for the Quebec market.`;
    case "message":
      return `${base}\nRewrite client-facing messages to be professional, warm, and conversion-oriented for real estate & mortgage leads.`;
    case "mortgage":
      return `${base}\nExplain Canadian mortgage concepts simply for first-time buyers in Quebec (clear, accurate, not personalized financial advice).
Use approachable language; note that a licensed broker should confirm details.`;
    default:
      return `${base}\nProduce concise, professional copy suitable for a premium real estate platform.`;
  }
}

function buildUserContent(params: {
  type: WriterType;
  action: WriterAction;
  prompt: string;
  listingContext?: ListingContext | null;
}): string {
  const { type, action, prompt, listingContext } = params;

  if (action === "correct_writing") {
    return `Correct spelling, grammar, and punctuation in the text below. Preserve meaning and layout as much as possible.\n\n---\n${prompt.trim()}\n---`;
  }

  if (action === "professional" || action === "shorter" || action === "persuasive") {
    const hint =
      action === "professional"
        ? "Make it more professional and polished."
        : action === "shorter"
          ? "Make it shorter while keeping key facts and CTA."
          : "Make it more persuasive without being aggressive or misleading.";
    if (!prompt.trim()) {
      return `User provided empty text. Write one short professional line inviting them to share details for ${type === "message" ? "their message" : "their listing"}.`;
    }
    if (type === "message") {
      return `${hint}\n\nRewrite this message to convert the client:\n---\n${prompt.trim()}\n---`;
    }
    return `${hint}\n\n---\n${prompt.trim()}\n---`;
  }

  if (action === "translate_fr" || action === "translate_en") {
    if (!prompt.trim()) return "User text was empty. Output a single polite sentence asking them to paste text.";
    return prompt.trim();
  }

  if (type === "listing" && action === "generate") {
    const ctx = listingContext ?? {};
    const parts = [
      "Write a full professional listing description (2–4 short paragraphs) using these facts:",
      ctx.propertyType ? `Property type: ${ctx.propertyType}` : null,
      ctx.location ? `Location: ${ctx.location}` : null,
      ctx.price ? `Price / rate: ${ctx.price}` : null,
      ctx.features ? `Features & amenities: ${ctx.features}` : null,
      prompt.trim() ? `Extra instructions from host: ${prompt.trim()}` : null,
    ].filter(Boolean);
    return parts.join("\n");
  }

  if (type === "mortgage") {
    const q = prompt.trim() || "Explain mortgage options simply — fixed vs variable, down payment, pre-approval, and what to prepare.";
    return q;
  }

  return prompt.trim() || "Write a short welcome paragraph for someone exploring real estate in Greater Montreal.";
}

/**
 * Polished sample rewrite when OpenAI is unavailable (message type + style actions).
 * Gives brokers a realistic preview without calling the API.
 */
function offlineClientMessageRewrite(prompt: string, action: WriterAction): string {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return (
      "Thank you for reaching out. I would appreciate a brief overview of suitable properties and " +
      "your availability for a short call to align on my criteria and next steps."
    );
  }

  const lower = trimmed.toLowerCase();
  const condo = /condo|condominium/.test(lower);
  const house = /\b(house|maison|single[-\s]?family|detached)\b/.test(lower) && !condo;
  const plex = /duplex|triplex|quadruplex|plex/.test(lower);
  const rent = /\b(rent|rental|lease|louer|à louer)\b/.test(lower);
  const buyCue = /\b(buy|purchase|acheter|invest|offers?|listings?)\b/.test(lower);
  const wantRent = rent && !/\b(buy|purchase|acheter)\b/.test(lower);

  let productNoun = "property";
  if (condo) productNoun = "condominium";
  else if (plex) productNoun = "plex";
  else if (house) productNoun = "single-family home";

  const article = /^[aeiou]/i.test(productNoun) ? "an" : "a";

  if (action === "shorter") {
    if (wantRent) {
      return `Thank you — I'm looking to rent ${article} ${productNoun}. Please share relevant listings or a quick time to connect.`;
    }
    return (
      `Thank you — I'm interested in purchasing ${article} ${productNoun}. ` +
      `Please send suitable listings or suggest a brief time to connect.`
    );
  }

  if (action === "persuasive") {
    const scope = wantRent ? "rental" : "purchase";
    return (
      `Thank you for your message. I'm actively evaluating ${scope} opportunities and would value a short conversation ` +
      `to align on neighbourhood, budget, and timeline. If you have curated listings or comparable sales, I'd welcome the introduction—` +
      `I'm ready to move when the fit is right.`
    );
  }

  // professional
  if (wantRent) {
    return (
      `Good day,\n\n` +
      `Thank you for reaching out. I'm interested in renting ${article} ${productNoun} and would welcome ` +
      `your recommendations on current listings that match my criteria. Please share a few suitable options, ` +
      `or suggest a convenient time for a brief call to discuss next steps.\n\n` +
      `Kind regards`
    );
  }

  return (
    `Good day,\n\n` +
    `Thank you for reaching out. I'm interested in exploring ${buyCue ? "purchase " : ""}opportunities for ${article} ${productNoun} ` +
    `and would appreciate your guidance on listings that suit my criteria. ` +
    `Please let me know if you have strong matches, or suggest a convenient time for a brief call.\n\n` +
    `Kind regards`
  );
}

/** Readable preview when OpenAI is not configured — avoids injecting “set API key” copy into listing textareas. */
function buildOfflineListingDescription(ctx: ListingContext | null, prompt: string): string {
  const propertyType = ctx?.propertyType?.trim() || "residential property";
  const location = ctx?.location?.trim() || "the Greater Montréal area";
  const price = ctx?.price?.trim();
  const features = ctx?.features?.trim();
  const notes = prompt.trim();

  const lead = `Welcome to this ${propertyType} in ${location}.${price ? ` Offered at ${price}.` : ""}`;
  const mid = features ? `Highlights include ${features}.` : "";
  const weave =
    notes.length > 0
      ? `Details from your notes: ${notes.slice(0, 500)}${notes.length > 500 ? "…" : ""}`
      : "";
  const close = `Schedule a visit to see the space and neighbourhood. Contact the seller through LECIPM to learn more.`;

  return [lead, mid, weave, close].filter((p) => p.length > 0).join("\n\n");
}

function buildOfflineWriterResponse(
  prompt: string,
  type: WriterType,
  action: WriterAction,
  user: string,
  listingContext?: ListingContext | null
): string {
  /** Client message polish — return only the rewrite so the textarea updates cleanly (hint comes from API). */
  if (type === "message" && (action === "professional" || action === "shorter" || action === "persuasive")) {
    return offlineClientMessageRewrite(prompt, action);
  }
  /** Without API, keep original text; UI shows offline hint for translation. */
  if (action === "translate_fr" || action === "translate_en") {
    return prompt.trim();
  }
  if (action === "correct_writing") {
    return prompt.trim();
  }

  if (type === "listing" && action === "generate") {
    return buildOfflineListingDescription(listingContext ?? null, prompt);
  }

  return (
    `AI writer requires OPENAI_API_KEY on the server.\n\n` +
    `— Preview (prompt to model) —\n` +
    `${user.slice(0, 600)}${user.length > 600 ? "…" : ""}\n\n` +
    `Once API keys are set, this becomes full professional output.`
  );
}

/**
 * Generate or transform copy for listings, messages, mortgage education, or general use.
 */
export async function generateText(
  prompt: string,
  type: WriterType,
  options: {
    action?: WriterAction;
    listingContext?: ListingContext | null;
  } = {}
): Promise<string> {
  const action = options.action ?? (type === "listing" ? "generate" : "professional");
  if (action === "correct_writing" && !prompt.trim()) {
    return "";
  }
  const system = buildSystemPrompt(type, action);
  const user = buildUserContent({ type, action, prompt, listingContext: options.listingContext ?? null });

  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    return buildOfflineWriterResponse(prompt, type, action, user, options.listingContext ?? null);
  }

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature:
      action === "correct_writing" ? 0.12 : action === "shorter" ? 0.35 : 0.65,
    max_tokens: action === "correct_writing" ? 8000 : 2000,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const out = completion.choices[0]?.message?.content?.trim();
  if (!out) {
    throw new Error("Empty model response");
  }
  return out;
}
