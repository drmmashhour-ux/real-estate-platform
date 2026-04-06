import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

const MODEL = process.env.OPENAI_MARKETING_MODEL ?? "gpt-4o-mini";

export async function marketingCompleteText(params: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ text: string; source: "openai" } | null> {
  if (!isOpenAiConfigured()) return null;
  try {
    const res = await openai.chat.completions.create({
      model: MODEL,
      temperature: params.temperature ?? 0.55,
      max_tokens: params.maxTokens ?? 700,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim();
    if (!text) return null;
    return { text, source: "openai" };
  } catch {
    return null;
  }
}

export async function marketingCompleteJson<T>(params: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<{ data: T; source: "openai" } | null> {
  if (!isOpenAiConfigured()) return null;
  try {
    const res = await openai.chat.completions.create({
      model: MODEL,
      temperature: params.temperature ?? 0.45,
      max_tokens: params.maxTokens ?? 900,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
    });
    const raw = res.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    const data = JSON.parse(raw) as T;
    return { data, source: "openai" };
  } catch {
    return null;
  }
}
