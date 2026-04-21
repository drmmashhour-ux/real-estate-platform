import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import type { RiskAssessment } from "@/modules/messaging/autopilot/autopilot.rules";
import { logInfo } from "@/lib/logger";

const TAG = "[ai-reply]";
const MODEL = "gpt-4o-mini";

export type ReplyGeneratorInput = {
  incomingClientMessage: string;
  transcriptSummary?: string;
  clientProfileSummary?: string;
  risk: RiskAssessment;
};

function offlineReply(input: Pick<ReplyGeneratorInput, "incomingClientMessage">): {
  reply: string;
  confidence: number;
} {
  const lower = input.incomingClientMessage.toLowerCase();
  if (/\b(hi|hello|hey|bonjour|salut)\b/.test(lower) && input.incomingClientMessage.length < 80) {
    return {
      reply:
        "Hi — thanks for reaching out. I’m here to help with this property and next steps whenever you’re ready.",
      confidence: 72,
    };
  }
  if (/\b(schedule|visit|showing|when can|available|calendar)\b/.test(lower)) {
    return {
      reply:
        "Thanks for your interest — I can arrange a visit. What days or times usually work best for you this week?",
      confidence: 68,
    };
  }
  return {
    reply:
      "Thanks for your message — I’ll review the details and follow up shortly with clear next steps.",
    confidence: 55,
  };
}

export async function generateBrokerAutopilotReply(
  input: ReplyGeneratorInput
): Promise<{ reply: string; confidence: number; source: "openai" | "template" }> {
  const fallback = offlineReply(input);

  if (!isOpenAiConfigured() || !openai) {
    logInfo(`${TAG} template`, { risk: input.risk.riskLevel });
    return { ...fallback, source: "template" };
  }

  const sys = [
    "You draft short replies for licensed Quebec real estate brokers on LECIPM.",
    "Output one message only — no markdown fences, no bullet lists unless essential.",
    "Stay professional and warm; no guarantees, no legal advice, no pricing commitments.",
    "Keep under ~600 characters unless the thread clearly needs slightly more.",
    input.risk.riskLevel === "HIGH"
      ? "High-sensitivity topic — acknowledge and invite a live conversation; do NOT negotiate numbers."
      : input.risk.riskLevel === "MEDIUM"
        ? "Pricing may be referenced only generically — defer specifics to call or official documents."
        : "Low sensitivity — helpful, concise, schedule-oriented when appropriate.",
  ].join("\n");

  const user = [
    input.transcriptSummary ? `Thread context:\n${input.transcriptSummary.slice(0, 3500)}` : null,
    input.clientProfileSummary ? `CRM hints:\n${input.clientProfileSummary.slice(0, 1200)}` : null,
    `Latest client message:\n${input.incomingClientMessage}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.45,
      max_tokens: 400,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    });
    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) throw new Error("empty");
    const confidence =
      input.risk.riskLevel === "HIGH" ? 52 : input.risk.riskLevel === "MEDIUM" ? 62 : 74;
    logInfo(`${TAG} openai`, { risk: input.risk.riskLevel });
    return { reply, confidence, source: "openai" };
  } catch (e) {
    logInfo(`${TAG} fallback`, { err: String(e) });
    return { ...fallback, source: "template" };
  }
}
