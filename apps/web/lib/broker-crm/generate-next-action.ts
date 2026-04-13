import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { appendBrokerCrmAiInsight } from "@/lib/broker-crm/ai-merge-insight";
import { trackBrokerCrm } from "@/lib/broker-crm/analytics";
import { getBrokerCrmLeadDetail } from "@/lib/broker-crm/get-lead";

const MODEL = "gpt-4o-mini";

export async function generateNextBestAction(leadId: string, brokerUserId: string): Promise<{ nextBestAction: string }> {
  const detail = await getBrokerCrmLeadDetail(leadId);
  if (!detail?.thread) throw new Error("Lead or thread not found");

  const messagesText = detail.thread.messages
    .map((m) => `${m.senderRole}: ${m.body}`)
    .join("\n");

  const system = `You suggest ONE short next action for a Québec real estate broker. Output JSON: {"nextBestAction":string}
Examples: "Reply today", "Offer visit times", "Follow up tomorrow", "Ask financing timeline", "Mark as qualified if call completed".
No legal advice. Be specific and short (max 120 chars).`;

  const user = `Status: ${detail.status}\nPriority: ${detail.priorityLabel}\nThread:\n${messagesText}`;

  let nextBestAction: string;
  if (!isOpenAiConfigured() || !openai) {
    nextBestAction =
      detail.status === "new" ? "Reply today — acknowledge the inquiry" : "Follow up and confirm next step with the buyer";
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
      const j = JSON.parse(raw) as { nextBestAction?: string };
      nextBestAction =
        typeof j.nextBestAction === "string" && j.nextBestAction.trim()
          ? j.nextBestAction.trim().slice(0, 200)
          : "Reply and propose a quick call";
    } catch {
      nextBestAction = "Reply and propose a quick call";
    }
  }

  await appendBrokerCrmAiInsight(leadId, detail.thread.id, {
    nextBestAction,
  });
  trackBrokerCrm("broker_crm_next_action_generated", { leadId }, { userId: brokerUserId });
  return { nextBestAction };
}
