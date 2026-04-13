import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

export type TitleFixResult = {
  proposedTitle: string;
  reason: string;
  confidenceScore: number;
};

function fallbackTitle(city: string, roomType: string | null, propertyType: string | null, current: string): string {
  const base = [roomType, propertyType, city].filter(Boolean).join(" · ");
  const candidate = base.trim() || current.trim();
  return candidate.slice(0, 118);
}

export async function generateTitleFix(input: {
  currentTitle: string;
  city: string;
  region?: string | null;
  roomType?: string | null;
  propertyType?: string | null;
  maxGuests: number;
  beds: number;
  issueHints: string[];
}): Promise<TitleFixResult> {
  const client = openai;
  const system = [
    "You rewrite BNHub short-term rental listing titles.",
    "Rules: use ONLY facts provided. Do not invent amenities, addresses, awards, or legal claims.",
    "Output JSON: {\"title\":\"...\",\"reason\":\"one sentence\",\"confidence\":0-100}",
    `Max title length 118 characters. City: ${input.city}.`,
  ].join("\n");

  const user = [
    `Current title: ${input.currentTitle}`,
    `Room: ${input.roomType ?? "n/a"} · Property: ${input.propertyType ?? "n/a"} · Guests: ${input.maxGuests} · Beds: ${input.beds}`,
    `Issues: ${input.issueHints.slice(0, 6).join(" | ") || "general polish"}`,
  ].join("\n");

  if (!isOpenAiConfigured() || !client) {
    const proposed = fallbackTitle(input.city, input.roomType ?? null, input.propertyType ?? null, input.currentTitle);
    return {
      proposedTitle: proposed,
      reason: "Deterministic polish (OpenAI not configured).",
      confidenceScore: 55,
    };
  }

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      max_tokens: 220,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(raw) as { title?: string; reason?: string; confidence?: number };
    const title = typeof parsed.title === "string" ? parsed.title.trim().slice(0, 118) : "";
    if (!title) throw new Error("empty title");
    return {
      proposedTitle: title,
      reason: typeof parsed.reason === "string" ? parsed.reason : "Model suggestion",
      confidenceScore: Math.min(100, Math.max(0, Number(parsed.confidence) || 72)),
    };
  } catch {
    const proposed = fallbackTitle(input.city, input.roomType ?? null, input.propertyType ?? null, input.currentTitle);
    return {
      proposedTitle: proposed,
      reason: "Fallback rewrite after model error — verify accuracy.",
      confidenceScore: 50,
    };
  }
}
