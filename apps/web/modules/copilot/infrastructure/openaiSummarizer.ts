import OpenAI from "openai";
import { logError } from "@/lib/logger";

/**
 * Optional second summarizer — same safety rules as {@link openaiResponsesClient}:
 * deterministic payloads only; never invent scores or legal conclusions.
 * Enable with `COPILOT_USE_OPENAI_SUMMARIZER=true` (off by default; prefer Responses API path).
 */
export async function summarizeCopilotResult(input: {
  userQuery: string;
  intent: string;
  deterministicPayload: unknown;
}): Promise<string | null> {
  if (process.env.COPILOT_USE_OPENAI_SUMMARIZER !== "true") {
    return null;
  }
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const model = process.env.COPILOT_SUMMARIZER_MODEL?.trim() || "gpt-4.1-mini";
  const client = new OpenAI({ apiKey: key });

  try {
    const res = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "Summarize deterministic real-estate analysis safely. Do not invent values. Do not override provided facts.",
        },
        {
          role: "user",
          content: JSON.stringify(input).slice(0, 14000),
        },
      ],
    });
    const text = res.output_text;
    if (typeof text === "string" && text.trim()) return text.trim();
    return null;
  } catch (e) {
    logError("summarizeCopilotResult failed", e);
    return null;
  }
}
