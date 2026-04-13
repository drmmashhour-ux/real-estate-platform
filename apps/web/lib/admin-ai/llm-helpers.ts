import { openai, isOpenAiConfigured } from "@/lib/ai/openai";

const SAFETY_SYSTEM = `You are an operations assistant for LECIPM admins.
Rules:
- Use ONLY facts present in the provided FACTS_JSON. Never invent numbers, names, or events.
- If a figure is missing, say "not available in signals" rather than guessing.
- Do not provide legal, tax, or regulatory advice.
- Output concise markdown or plain text suitable for a dashboard card.
- Prefer short bullet lists.`;


export async function polishAdminCopy(args: {
  task: string;
  factsJson: string;
  fallbackText: string;
}): Promise<string> {
  if (!openai || !isOpenAiConfigured()) {
    return args.fallbackText;
  }
  const model = process.env.ADMIN_AI_MODEL?.trim() || "gpt-4o-mini";
  try {
    const res = await openai.chat.completions.create({
      model,
      temperature: 0.15,
      max_tokens: 1200,
      messages: [
        { role: "system", content: SAFETY_SYSTEM },
        {
          role: "user",
          content: `${args.task}\n\nFACTS_JSON:\n${args.factsJson}\n\nIf you cannot ground every claim in FACTS_JSON, return the word FALLBACK_ONLY.`,
        },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim() ?? "";
    if (!text || text.includes("FALLBACK_ONLY")) {
      return args.fallbackText;
    }
    return text;
  } catch {
    return args.fallbackText;
  }
}
