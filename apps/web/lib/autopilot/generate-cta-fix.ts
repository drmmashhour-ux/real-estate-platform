import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

export type CtaFixResult = {
  proposedSubtitle: string;
  reason: string;
  confidenceScore: number;
};

export async function generateCtaFix(input: {
  currentSubtitle: string;
  title: string;
  city: string;
  issueHints: string[];
}): Promise<CtaFixResult> {
  const client = openai;
  const system = [
    "Write a single-line subtitle (hook) under the listing title for a vacation rental marketplace.",
    "Use only facts implied by the title/city. No promises, no discounts, no superlatives like 'best' unless trivial.",
    "Output JSON: {\"subtitle\":\"...\",\"reason\":\"...\",\"confidence\":0-100}. Max 140 chars for subtitle.",
  ].join("\n");

  const user = `Title: ${input.title}\nCity: ${input.city}\nCurrent subtitle: ${input.currentSubtitle || "(empty)"}\nIssues: ${input.issueHints.slice(0, 5).join(" | ")}`;

  if (!isOpenAiConfigured() || !client) {
    const hook = input.currentSubtitle.trim() || `Comfortable stay · ${input.city}`;
    return {
      proposedSubtitle: hook.slice(0, 140),
      reason: "Deterministic hook (OpenAI not configured).",
      confidenceScore: 52,
    };
  }

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.45,
      max_tokens: 200,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(raw) as { subtitle?: string; reason?: string; confidence?: number };
    const subtitle = typeof parsed.subtitle === "string" ? parsed.subtitle.trim().slice(0, 140) : "";
    if (!subtitle) throw new Error("empty");
    return {
      proposedSubtitle: subtitle,
      reason: typeof parsed.reason === "string" ? parsed.reason : "Model suggestion",
      confidenceScore: Math.min(100, Math.max(0, Number(parsed.confidence) || 68)),
    };
  } catch {
    const hook = input.currentSubtitle.trim() || `Relax in ${input.city}`;
    return { proposedSubtitle: hook.slice(0, 140), reason: "Fallback subtitle.", confidenceScore: 45 };
  }
}
