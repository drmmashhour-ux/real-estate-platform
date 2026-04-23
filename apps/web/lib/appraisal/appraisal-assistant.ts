import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { APPRAISAL_SUPPORT_LABELS } from "@/lib/appraisal/compliance-copy";

const SYSTEM = `You are a valuation support assistant for real estate brokers. 
Use only this framing: ${APPRAISAL_SUPPORT_LABELS.productLine}; ${APPRAISAL_SUPPORT_LABELS.report}; ${APPRAISAL_SUPPORT_LABELS.estimate}.
Never claim an automatic certified appraisal. If asked for certification, explain that a certified appraisal requires separate professional review and signing.
Keep answers concise (bullet points when helpful).`;

export async function runAppraisalAssistantPrompt(input: {
  userQuestion: string;
  caseTitle?: string | null;
  reportNumber?: string | null;
}): Promise<{ reply: string; source: "openai" | "fallback" }> {
  const context = [
    input.caseTitle ? `Case: ${input.caseTitle}` : null,
    input.reportNumber ? `Reference: ${input.reportNumber}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (!isOpenAiConfigured() || !openai) {
    return {
      source: "fallback",
      reply: [
        APPRAISAL_SUPPORT_LABELS.disclaimerShort,
        "",
        "OpenAI is not configured — here are quick prompts you can use manually:",
        "- Summarize how the sales comparison supports your market estimate.",
        "- List key assumptions a reviewer should confirm before finalizing the appraisal report draft.",
        "- Flag what is still missing from the income or cost approach worksheets.",
        "",
        `Your question: ${input.userQuestion}`,
      ].join("\n"),
    };
  }

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [context, input.userQuestion].filter(Boolean).join("\n\n"),
      },
    ],
  });
  const reply = res.choices[0]?.message?.content?.trim() || "No response.";
  return { reply, source: "openai" };
}
