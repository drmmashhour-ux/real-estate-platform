import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { appendBrokerCrmAiInsight } from "@/lib/broker-crm/ai-merge-insight";
import { trackBrokerCrm } from "@/lib/broker-crm/analytics";
import { getBrokerCrmLeadDetail } from "@/lib/broker-crm/get-lead";

const MODEL = "gpt-4o-mini";

export type AiSummaryResult = {
  summary: string;
  mainQuestions: string[];
  urgencyClues: string;
  intentClues: string;
  intentScore: number;
  urgencyScore: number;
  confidenceScore: number;
};

function fallbackSummary(threadText: string): AiSummaryResult {
  const clip = threadText.slice(0, 1200);
  return {
    summary:
      clip.trim().length > 0
        ? `Snapshot: ${clip.slice(0, 400)}${clip.length > 400 ? "…" : ""}`
        : "No messages yet — add context from the thread when the buyer writes in.",
    mainQuestions: [],
    urgencyClues: "Unknown — OpenAI not configured or no conversation text.",
    intentClues: "Unknown — confirm intent on the phone or in messages.",
    intentScore: 35,
    urgencyScore: 30,
    confidenceScore: 40,
  };
}

export async function generateAiLeadSummary(leadId: string, brokerUserId: string): Promise<AiSummaryResult> {
  const detail = await getBrokerCrmLeadDetail(leadId);
  if (!detail?.thread) throw new Error("Lead or thread not found");

  const notesText = detail.notes.map((n) => n.body).join("\n---\n");
  const messagesText = detail.thread.messages
    .map((m) => `${m.senderRole}: ${m.body}`)
    .join("\n");
  const listingFacts = detail.listing
    ? `Title: ${detail.listing.title}\nCode: ${detail.listing.listingCode}\nList price (MLS record): ${detail.listing.price}`
    : "No listing attached.";

  const system = `You assist licensed Québec real estate brokers using LECIPM. Reply with valid JSON only.
Schema: {"summary":string,"mainQuestions":string[],"urgencyClues":string,"intentClues":string,"intentScore":number,"urgencyScore":number,"confidenceScore":number}
Scores are integers 0-100.
Rules: Do NOT invent property facts, pricing, taxes, legal conclusions, or availability. If unknown, say so in the strings and keep scores moderate. Only mention budget if explicitly stated in the thread.`;

  const user = `Listing context (facts only — do not invent beyond this):\n${listingFacts}\n\nThread messages:\n${messagesText}\n\nBroker notes:\n${notesText || "(none)"}`;

  let parsed: AiSummaryResult;
  if (!isOpenAiConfigured() || !openai) {
    parsed = fallbackSummary(messagesText);
  } else {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    try {
      const j = JSON.parse(raw) as Record<string, unknown>;
      parsed = {
        summary: typeof j.summary === "string" ? j.summary : fallbackSummary(messagesText).summary,
        mainQuestions: Array.isArray(j.mainQuestions) ? j.mainQuestions.filter((x) => typeof x === "string") : [],
        urgencyClues: typeof j.urgencyClues === "string" ? j.urgencyClues : "",
        intentClues: typeof j.intentClues === "string" ? j.intentClues : "",
        intentScore: typeof j.intentScore === "number" ? Math.min(100, Math.max(0, j.intentScore)) : 40,
        urgencyScore: typeof j.urgencyScore === "number" ? Math.min(100, Math.max(0, j.urgencyScore)) : 30,
        confidenceScore: typeof j.confidenceScore === "number" ? Math.min(100, Math.max(0, j.confidenceScore)) : 45,
      };
    } catch {
      parsed = fallbackSummary(messagesText);
    }
  }

  const block = [
    parsed.summary,
    parsed.mainQuestions.length ? `Questions: ${parsed.mainQuestions.join("; ")}` : "",
    parsed.urgencyClues ? `Urgency: ${parsed.urgencyClues}` : "",
    parsed.intentClues ? `Intent: ${parsed.intentClues}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  await appendBrokerCrmAiInsight(leadId, detail.thread.id, {
    summary: block,
    intentScore: parsed.intentScore,
    urgencyScore: parsed.urgencyScore,
    confidenceScore: parsed.confidenceScore,
  });

  trackBrokerCrm("broker_crm_ai_summary_generated", { leadId }, { userId: brokerUserId });
  return parsed;
}
