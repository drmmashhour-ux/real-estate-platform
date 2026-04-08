/**
 * AI + rules: extract OTA / metasearch property references from URLs or pasted text.
 * Does not scrape third-party sites — hosts paste public links or channel-manager payloads.
 * Official sync remains: iCal, partner APIs, webhooks (see channel-integration.ts).
 */

import { createHash } from "crypto";
import { BnhubChannelPlatform } from "@prisma/client";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { prisma } from "@/lib/db";

export type OtaReferenceParseResult = {
  platform: BnhubChannelPlatform | null;
  externalPropertyId: string | null;
  propertyNameGuess: string | null;
  nightlyPriceCentsGuess: number | null;
  currencyGuess: string | null;
  confidence: number;
  source: "openai" | "rules";
  notes?: string;
};

export type NormalizedWebhookReservation = {
  platform: BnhubChannelPlatform;
  externalListingId: string;
  reservation_id: string;
  check_in: string;
  check_out: string;
  cancelled: boolean;
};

export function otaInputDigest(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 64);
}

function pickPlatformFromHost(host: string): BnhubChannelPlatform | null {
  const h = host.toLowerCase();
  if (h.includes("airbnb.")) return BnhubChannelPlatform.AIRBNB;
  if (h.includes("booking.com")) return BnhubChannelPlatform.BOOKING_COM;
  if (h.includes("expedia.")) return BnhubChannelPlatform.EXPEDIA;
  if (h.includes("hotels.com")) return BnhubChannelPlatform.HOTELS_COM;
  if (h.includes("vrbo.com") || h.includes("homeaway.")) return BnhubChannelPlatform.VRBO;
  if (h.includes("trivago.")) return BnhubChannelPlatform.TRIVAGO;
  if (h.includes("google.") && h.includes("travel")) return BnhubChannelPlatform.GOOGLE_HOTEL;
  return null;
}

/** Heuristic extraction when OpenAI is off or as a cross-check. */
export function ruleBasedParseOtaReference(input: { text?: string; url?: string }): OtaReferenceParseResult {
  const blob = `${input.url ?? ""}\n${input.text ?? ""}`.trim();
  if (!blob) {
    return {
      platform: null,
      externalPropertyId: null,
      propertyNameGuess: null,
      nightlyPriceCentsGuess: null,
      currencyGuess: null,
      confidence: 0,
      source: "rules",
      notes: "No input",
    };
  }

  let platform: BnhubChannelPlatform | null = null;
  let externalPropertyId: string | null = null;

  try {
    if (input.url) {
      const u = new URL(input.url.startsWith("http") ? input.url : `https://${input.url}`);
      platform = pickPlatformFromHost(u.hostname);

      const path = u.pathname + u.search;
      const air = path.match(/\/rooms\/(\d+)/i);
      if (air) {
        platform = BnhubChannelPlatform.AIRBNB;
        externalPropertyId = air[1]!;
      }
      const bk = path.match(/hotel_id=(\d+)/i) ?? path.match(/\/hotel\/[^/]+\.([a-z]{2})\.html/i);
      if (bk && /booking\.com/i.test(u.hostname)) {
        platform = BnhubChannelPlatform.BOOKING_COM;
        if (/^\d+$/.test(bk[1]!)) externalPropertyId = bk[1]!;
      }
      const exp = path.match(/\.h(\d+)\./i) ?? u.searchParams.get("selected")?.match(/(\d{4,})/);
      if (/expedia\./i.test(u.hostname) && exp) {
        platform = BnhubChannelPlatform.EXPEDIA;
        externalPropertyId = typeof exp === "object" && "1" in exp ? exp[1]! : String(exp);
      }
      const ho = path.match(/\/ho(\d+)/i);
      if (/hotels\.com/i.test(u.hostname) && ho) {
        platform = BnhubChannelPlatform.HOTELS_COM;
        externalPropertyId = ho[1]!;
      }
      const tri = path.match(/hotel[_-]?id[=:](\d+)/i) ?? path.match(/\/search\?.*tid=([^&]+)/);
      if (/trivago\./i.test(u.hostname) && tri) {
        platform = BnhubChannelPlatform.TRIVAGO;
        externalPropertyId = tri[1]!.slice(0, 120);
      }
      const gEnt = path.match(/\/entity\/([^/?]+)/);
      if (/google\./i.test(u.hostname) && path.includes("/travel/hotels") && gEnt) {
        platform = BnhubChannelPlatform.GOOGLE_HOTEL;
        externalPropertyId = decodeURIComponent(gEnt[1]!).slice(0, 200);
      }
    }

    const idOnly = blob.match(/\b(?:property|listing|hotel)[_ ]?id[:\s]+([A-Za-z0-9_-]{4,80})\b/i);
    if (!externalPropertyId && idOnly) externalPropertyId = idOnly[1]!.trim();

    const price = blob.match(/\b(?:USD|CAD|EUR|US\$|CA\$)?\s*\$?\s*(\d{2,4})\s*(?:\/\s*night|per night|\/nt)?\b/i);
    const nightlyPriceCentsGuess = price ? parseInt(price[1]!, 10) * 100 : null;
    const cur = blob.match(/\b(USD|CAD|EUR)\b/i);
    const currencyGuess = cur ? cur[1]!.toUpperCase() : null;

    const nameGuess =
      blob.match(/property[:\s]+([^\n.]{4,120})/i)?.[1]?.trim() ??
      blob.match(/"name"\s*:\s*"([^"]{4,120})"/)?.[1] ??
      null;

    let confidence = 0.35;
    if (platform && externalPropertyId) confidence = 0.72;
    else if (platform) confidence = 0.45;
    else if (externalPropertyId) confidence = 0.4;

    return {
      platform,
      externalPropertyId,
      propertyNameGuess: nameGuess,
      nightlyPriceCentsGuess,
      currencyGuess,
      confidence,
      source: "rules",
    };
  } catch {
    return {
      platform: null,
      externalPropertyId: null,
      propertyNameGuess: null,
      nightlyPriceCentsGuess: null,
      currencyGuess: null,
      confidence: 0.15,
      source: "rules",
      notes: "URL parse failed — try pasting full https link or property id line.",
    };
  }
}

async function openAiParseReference(blob: string): Promise<Partial<OtaReferenceParseResult> | null> {
  const client = openai;
  if (!isOpenAiConfigured() || !client) return null;
  try {
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_OTA_PARSE_MODEL ?? "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You extract structured data from OTA / hotel metasearch URLs or pasted snippets.
Respond with JSON only:
{
  "platform": "BOOKING_COM"|"AIRBNB"|"EXPEDIA"|"VRBO"|"HOTELS_COM"|"TRIVAGO"|"GOOGLE_HOTEL"|"OTHER"|null,
  "externalPropertyId": string|null,
  "propertyNameGuess": string|null,
  "nightlyPriceCentsGuess": number|null,
  "currencyGuess": "USD"|"CAD"|"EUR"|null,
  "confidence": number 0-1,
  "notes": string|null
}
Never invent a numeric property id; use null if unsure. Trivago often lacks a single id — use partner hotel id from URL if present.`,
        },
        { role: "user", content: blob.slice(0, 8000) },
      ],
      response_format: { type: "json_object" },
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) return null;
    return JSON.parse(raw) as Partial<OtaReferenceParseResult>;
  } catch {
    return null;
  }
}

function toPrismaPlatform(s: string | null | undefined): BnhubChannelPlatform | null {
  if (!s) return null;
  const u = s.toUpperCase().replace(/\s/g, "_");
  if (u in BnhubChannelPlatform) return BnhubChannelPlatform[u as keyof typeof BnhubChannelPlatform];
  return null;
}

export async function parseOtaListingReference(input: {
  text?: string;
  url?: string;
}): Promise<OtaReferenceParseResult> {
  const rules = ruleBasedParseOtaReference(input);
  const blob = `${input.url ?? ""}\n${input.text ?? ""}`.trim();
  if (!blob) return rules;

  const ai = await openAiParseReference(blob);
  if (!ai || ai.confidence == null) {
    return rules;
  }

  const platform = toPrismaPlatform(ai.platform as string) ?? rules.platform;
  const externalPropertyId =
    typeof ai.externalPropertyId === "string" && ai.externalPropertyId.trim()
      ? ai.externalPropertyId.trim().slice(0, 500)
      : rules.externalPropertyId;

  const merged: OtaReferenceParseResult = {
    platform: platform ?? rules.platform,
    externalPropertyId: externalPropertyId ?? rules.externalPropertyId,
    propertyNameGuess:
      typeof ai.propertyNameGuess === "string" ? ai.propertyNameGuess.slice(0, 200) : rules.propertyNameGuess,
    nightlyPriceCentsGuess:
      typeof ai.nightlyPriceCentsGuess === "number" && Number.isFinite(ai.nightlyPriceCentsGuess)
        ? Math.round(ai.nightlyPriceCentsGuess)
        : rules.nightlyPriceCentsGuess,
    currencyGuess:
      typeof ai.currencyGuess === "string" ? ai.currencyGuess.slice(0, 8) : rules.currencyGuess,
    confidence: Math.max(0, Math.min(1, Number(ai.confidence))),
    source: "openai",
    notes: typeof ai.notes === "string" ? ai.notes.slice(0, 500) : rules.notes,
  };

  if (rules.platform && rules.externalPropertyId && merged.confidence < 0.55) {
    merged.platform = merged.platform ?? rules.platform;
    merged.externalPropertyId = merged.externalPropertyId ?? rules.externalPropertyId;
    merged.confidence = Math.max(merged.confidence, rules.confidence);
  }

  return merged;
}

export async function normalizeWebhookPayloadWithAi(raw: unknown): Promise<{
  normalized: NormalizedWebhookReservation | null;
  confidence: number;
  source: "openai" | "rules";
  notes?: string;
}> {
  const str = typeof raw === "string" ? raw : JSON.stringify(raw ?? {});
  const digest = str.slice(0, 12000);

  const rulesNorm = (): NormalizedWebhookReservation | null => {
    const o = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
    const externalListingId = String(o.externalListingId ?? o.listing_id ?? o.property_id ?? "");
    const check_in = String(o.check_in ?? o.checkIn ?? o.start_date ?? "");
    const check_out = String(o.check_out ?? o.checkOut ?? o.end_date ?? "");
    const reservation_id = String(o.reservation_id ?? o.id ?? o.booking_id ?? "");
    const cancelled = o.cancelled === true || o.status === "cancelled";
    const platformRaw = String(o.platform ?? o.channel ?? "").toLowerCase();
    let platform: BnhubChannelPlatform = BnhubChannelPlatform.BOOKING_COM;
    if (platformRaw.includes("airbnb")) platform = BnhubChannelPlatform.AIRBNB;
    else if (platformRaw.includes("expedia")) platform = BnhubChannelPlatform.EXPEDIA;
    else if (platformRaw.includes("vrbo")) platform = BnhubChannelPlatform.VRBO;
    else if (platformRaw.includes("trivago")) platform = BnhubChannelPlatform.TRIVAGO;
    else if (platformRaw.includes("hotels.com") || platformRaw.includes("hotels_com"))
      platform = BnhubChannelPlatform.HOTELS_COM;
    else if (platformRaw.includes("google")) platform = BnhubChannelPlatform.GOOGLE_HOTEL;

    if (!externalListingId || !check_in || !check_out) return null;
    return {
      platform,
      externalListingId,
      reservation_id: reservation_id || "unknown",
      check_in,
      check_out,
      cancelled,
    };
  };

  const fromRules = rulesNorm();
  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    return {
      normalized: fromRules,
      confidence: fromRules ? 0.55 : 0,
      source: "rules",
    };
  }

  try {
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_OTA_PARSE_MODEL ?? "gpt-4o-mini",
      temperature: 0,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: `Map channel-manager / OTA webhook JSON to a single normalized object. JSON only:
{
  "platform": "BOOKING_COM"|"AIRBNB"|"EXPEDIA"|"VRBO"|"HOTELS_COM"|"TRIVAGO"|"GOOGLE_HOTEL"|"OTHER",
  "externalListingId": string,
  "reservation_id": string,
  "check_in": string (ISO date),
  "check_out": string (ISO date),
  "cancelled": boolean,
  "confidence": number 0-1,
  "notes": string|null
}
Use field names from the payload; never fabricate dates.`,
        },
        { role: "user", content: digest },
      ],
      response_format: { type: "json_object" },
    });
    const rawOut = res.choices[0]?.message?.content;
    if (!rawOut) {
      return { normalized: fromRules, confidence: fromRules ? 0.5 : 0, source: "rules" };
    }
    const j = JSON.parse(rawOut) as Record<string, unknown>;
    const platform = toPrismaPlatform(String(j.platform ?? "")) ?? BnhubChannelPlatform.OTHER;
    const normalized: NormalizedWebhookReservation = {
      platform,
      externalListingId: String(j.externalListingId ?? "").slice(0, 500),
      reservation_id: String(j.reservation_id ?? "").slice(0, 200),
      check_in: String(j.check_in ?? ""),
      check_out: String(j.check_out ?? ""),
      cancelled: j.cancelled === true,
    };
    if (!normalized.externalListingId || !normalized.check_in || !normalized.check_out) {
      return {
        normalized: fromRules,
        confidence: fromRules ? 0.55 : 0,
        source: "rules",
        notes: "AI output incomplete; used rules fallback if possible",
      };
    }
    return {
      normalized,
      confidence: Math.min(1, Math.max(0, Number(j.confidence) || 0.75)),
      source: "openai",
      notes: typeof j.notes === "string" ? j.notes : undefined,
    };
  } catch {
    return { normalized: fromRules, confidence: fromRules ? 0.5 : 0, source: "rules" };
  }
}

export async function persistOtaAiTrace(params: {
  userId: string;
  listingId?: string | null;
  traceType: string;
  sourceLabel?: string | null;
  inputText: string;
  result: object;
  model?: string | null;
}): Promise<void> {
  const digest = otaInputDigest(params.inputText.slice(0, 32000));
  await prisma.bnhubOtaAiTrace
    .create({
      data: {
        userId: params.userId,
        listingId: params.listingId ?? undefined,
        traceType: params.traceType.slice(0, 40),
        sourceLabel: params.sourceLabel?.slice(0, 80) ?? undefined,
        inputDigest: digest,
        resultJson: params.result as object,
        model: params.model?.slice(0, 80) ?? undefined,
      },
    })
    .catch(() => {});
}
