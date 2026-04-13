import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

export type DescriptionFixResult = {
  proposedDescription: string;
  reason: string;
  confidenceScore: number;
};

export async function generateDescriptionFix(input: {
  currentDescription: string;
  city: string;
  amenitiesSample: string[];
  houseRulesExcerpt: string;
  issueHints: string[];
}): Promise<DescriptionFixResult> {
  const client = openai;
  const system = [
    "You improve BNHub stay descriptions for clarity and scannability (short paragraphs, bullets where helpful).",
    "STRICT: only use facts from the user payload. Never invent amenities, parking, pet rules, or legal statements.",
    "Do not add discounts, guarantees, or regulatory claims.",
    "Output JSON: {\"description\":\"...\",\"reason\":\"one sentence\",\"confidence\":0-100}",
  ].join("\n");

  const user = [
    `City: ${input.city}`,
    `Current description:\n${input.currentDescription.slice(0, 12000)}`,
    `Amenities (verbatim labels only): ${input.amenitiesSample.slice(0, 40).join(", ") || "n/a"}`,
    `House rules excerpt: ${input.houseRulesExcerpt.slice(0, 800) || "n/a"}`,
    `Issues: ${input.issueHints.slice(0, 8).join(" | ") || "clarity"}`,
  ].join("\n\n");

  if (!isOpenAiConfigured() || !client) {
    const proposed =
      input.currentDescription.trim() ||
      `Welcome to your stay in ${input.city}. Please review photos, amenities, and house rules before booking.`;
    return {
      proposedDescription: proposed.slice(0, 8000),
      reason: "Passthrough / light template (OpenAI not configured).",
      confidenceScore: 48,
    };
  }

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 2200,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(raw) as { description?: string; reason?: string; confidence?: number };
    const description = typeof parsed.description === "string" ? parsed.description.trim() : "";
    if (!description) throw new Error("empty");
    return {
      proposedDescription: description.slice(0, 8000),
      reason: typeof parsed.reason === "string" ? parsed.reason : "Model suggestion",
      confidenceScore: Math.min(100, Math.max(0, Number(parsed.confidence) || 70)),
    };
  } catch {
    return {
      proposedDescription: input.currentDescription.slice(0, 8000),
      reason: "Could not safely rewrite — kept existing text.",
      confidenceScore: 40,
    };
  }
}
