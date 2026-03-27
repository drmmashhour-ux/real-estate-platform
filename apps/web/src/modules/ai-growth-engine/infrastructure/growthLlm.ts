import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

export async function growthJsonCompletion<T>(args: {
  system: string;
  user: string;
  /** Optional schema name for logging only */
  label?: string;
}): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  if (!isOpenAiConfigured()) {
    return { ok: false, error: "OpenAI is not configured (OPENAI_API_KEY)." };
  }
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) return { ok: false, error: "Empty model response" };
    const data = JSON.parse(raw) as T;
    return { ok: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "LLM error";
    return { ok: false, error: msg };
  }
}
