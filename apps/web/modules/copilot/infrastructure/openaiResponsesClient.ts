import OpenAI from "openai";
import { logError } from "@/lib/logger";

/**
 * Optional summarization via OpenAI Responses API — **after** deterministic platform data is computed.
 * Never use for scores, approvals, or legal conclusions.
 */
export async function summarizeDeterministicCopilotPayload(args: {
  userQuery: string;
  /** Sanitized JSON-serializable block from deterministic engines only. */
  payload: unknown;
}): Promise<string | null> {
  if (process.env.COPILOT_USE_RESPONSES_API !== "true") {
    return null;
  }
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const model = process.env.COPILOT_RESPONSES_MODEL?.trim() || "gpt-4.1-mini";
  const client = new OpenAI({ apiKey: key });

  try {
    const res = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "You summarize pre-computed real-estate assistant data. Do not invent numbers, scores, approvals, or legal conclusions. " +
            "If data is missing, say so. Keep under 120 words.",
        },
        {
          role: "user",
          content: `User question:\n${args.userQuery}\n\nDeterministic payload (JSON):\n${JSON.stringify(args.payload).slice(0, 12000)}`,
        },
      ],
    });

    const text = res.output_text;
    if (typeof text === "string" && text.trim()) return text.trim();
    return null;
  } catch (e) {
    logError("Copilot Responses API summarize failed", e);
    return null;
  }
}
