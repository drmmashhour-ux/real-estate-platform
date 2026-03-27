import OpenAI from "openai";

export async function groundedComposeWithResponsesApi(input: {
  instruction: string;
  query: string;
  deterministicPayload: unknown;
  retrievedContext: Array<{ memoryType: string; content: string }>;
}): Promise<string | null> {
  if (process.env.COPILOT_USE_RESPONSES_API !== "true") return null;
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  const model = process.env.COPILOT_RESPONSES_MODEL?.trim() || "gpt-4.1-mini";
  const openai = new OpenAI({ apiKey: key });

  try {
    const res = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "Grounded composition only. Use deterministic payload and retrieved context. If missing data, explicitly say unknown. Never invent scores.",
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction: input.instruction,
            query: input.query,
            deterministicPayload: input.deterministicPayload,
            retrievedContext: input.retrievedContext.slice(0, 8),
          }).slice(0, 15000),
        },
      ],
    });
    const txt = res.output_text?.trim();
    return txt || null;
  } catch {
    return null;
  }
}
