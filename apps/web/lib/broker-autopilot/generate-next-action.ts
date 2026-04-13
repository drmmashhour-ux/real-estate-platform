import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { getBrokerCrmLeadDetail } from "@/lib/broker-crm/get-lead";
import { trackBrokerAutopilot } from "@/lib/broker-autopilot/analytics";

const MODEL = "gpt-4o-mini";

export async function generateAutopilotNextAction(leadId: string, brokerUserId: string): Promise<{
  nextBestAction: string;
  reason: string;
}> {
  const detail = await getBrokerCrmLeadDetail(leadId);
  if (!detail) throw new Error("Lead not found");

  const messagesText = detail.thread
    ? detail.thread.messages.map((m) => `${m.senderRole}: ${m.body}`).join("\n")
    : "(no thread)";
  const listingFacts = detail.listing
    ? `Title: ${detail.listing.title}\nCode: ${detail.listing.listingCode}`
    : "No listing attached.";

  const system = `You suggest the single best next step for a broker working a lead.
Output JSON: {"nextBestAction":string,"reason":string}
Be practical (e.g. "Reply today", "Offer visit times"). Do not invent property facts or pricing.`;

  const user = `Status: ${detail.status}\nLast contact: ${detail.lastContactAt?.toISOString() ?? "unknown"}\nListing:\n${listingFacts}\n\nThread:\n${messagesText}`;

  let nextBestAction: string;
  let reason: string;
  if (!isOpenAiConfigured() || !openai) {
    nextBestAction = "Reply to the latest message";
    reason = "Keeps momentum while details are fresh.";
  } else {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    try {
      const j = JSON.parse(raw) as { nextBestAction?: string; reason?: string };
      nextBestAction = typeof j.nextBestAction === "string" ? j.nextBestAction.trim() : "";
      reason = typeof j.reason === "string" ? j.reason.trim() : "";
    } catch {
      nextBestAction = "";
      reason = "";
    }
    if (!nextBestAction) {
      nextBestAction = "Follow up with the lead";
      reason = "Based on current thread activity.";
    }
  }

  trackBrokerAutopilot("broker_autopilot_next_action_generated", { leadId }, { userId: brokerUserId });
  return { nextBestAction, reason };
}
