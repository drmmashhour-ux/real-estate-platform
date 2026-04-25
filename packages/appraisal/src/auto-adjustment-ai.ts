import { z } from "zod";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

const MODEL = process.env.APPRAISAL_ADJUSTMENT_AI_MODEL?.trim() || "gpt-4o-mini";

const adjustmentSchema = z.object({
  adjustmentType: z.string().min(1),
  label: z.string().min(1),
  suggestedAmountCents: z.number().int().nonnegative(),
  direction: z.enum(["plus", "minus"]),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
  sourceType: z.enum(["ai_assist", "hybrid"]).optional(),
});

const responseSchema = z.object({
  adjustments: z.array(adjustmentSchema),
  summary: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

export type AutoAdjustmentAiResult = z.infer<typeof responseSchema>;

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function runAutoAdjustmentModel(prompt: string): Promise<AutoAdjustmentAiResult> {
  const client = openai;
  if (!isOpenAiConfigured() || !client) {
    return { adjustments: [], summary: "OpenAI not configured — rule-based proposals only.", warnings: ["OPENAI_NOT_CONFIGURED"] };
  }

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.25,
    max_tokens: 2500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You output only valid JSON. Broker decision-support only — never claim a certified appraisal or unconditional market value.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!raw) {
    return { adjustments: [], summary: null, warnings: ["EMPTY_AI_RESPONSE"] };
  }

  try {
    const parsed = JSON.parse(stripJsonFences(raw)) as unknown;
    return responseSchema.parse(parsed);
  } catch {
    return {
      adjustments: [],
      summary: null,
      warnings: ["AI_JSON_PARSE_FAILED"],
    };
  }
}
