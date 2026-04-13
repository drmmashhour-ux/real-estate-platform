import { openai, isOpenAiConfigured } from "@/lib/ai/openai";

export async function explainAlertPlainLanguage(alert: {
  title: string;
  body: string;
  severity: string;
}): Promise<string> {
  if (!openai || !isOpenAiConfigured()) {
    return `${alert.title}: ${alert.body} (Severity: ${alert.severity}). Broker review required — AI assistive only.`;
  }
  const res = await openai.chat.completions.create({
    model: process.env.LEGAL_FORM_AI_MODEL?.trim() || "gpt-4o-mini",
    temperature: 0.1,
    max_tokens: 400,
    messages: [
      {
        role: "system",
        content:
          "Rewrite the alert in plain language for a broker. Do not add facts. No legal conclusions. 2–4 sentences.",
      },
      {
        role: "user",
        content: JSON.stringify(alert),
      },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? alert.body;
}
