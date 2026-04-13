import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { appendBrokerCrmAiInsight } from "@/lib/broker-crm/ai-merge-insight";
import { trackBrokerCrm } from "@/lib/broker-crm/analytics";
import { getBrokerCrmLeadDetail } from "@/lib/broker-crm/get-lead";

const MODEL = "gpt-4o-mini";

export async function generateAiReplyDraft(leadId: string, brokerUserId: string): Promise<{ draft: string }> {
  const detail = await getBrokerCrmLeadDetail(leadId);
  if (!detail?.thread) throw new Error("Lead or thread not found");

  const messagesText = detail.thread.messages
    .map((m) => `${m.senderRole}: ${m.body}`)
    .join("\n");
  const listingFacts = detail.listing
    ? `Title: ${detail.listing.title}\nCode: ${detail.listing.listingCode}\nRecorded list price: ${detail.listing.price}`
    : "No listing attached.";

  const system = `You draft broker replies for LECIPM (Québec). Output valid JSON: {"draft":string}
Tone: professional, warm, concise. Canadian French/English ok if thread is French.
Never invent price, taxes, inclusions, or legal promises. Invite next step (call, visit) without guaranteeing availability.
The broker must edit before sending — include only safe, generic guidance when facts are missing.`;

  const user = `Lead status: ${detail.status}\nListing facts (do not invent beyond):\n${listingFacts}\n\nThread:\n${messagesText}`;

  let draft: string;
  if (!isOpenAiConfigured() || !openai) {
    draft =
      "Thanks for reaching out — I’d be glad to help. Could you share your timeline and the best way to reach you? " +
      "I can then outline next steps and, if useful, schedule a call or visit depending on availability.";
  } else {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.45,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    try {
      const j = JSON.parse(raw) as { draft?: string };
      draft = typeof j.draft === "string" && j.draft.trim() ? j.draft.trim() : "";
    } catch {
      draft = "";
    }
    if (!draft) {
      draft =
        "Thank you for your message. I’m reviewing the details and will follow up shortly with next steps.";
    }
  }

  await appendBrokerCrmAiInsight(leadId, detail.thread.id, {
    suggestedReply: draft,
  });
  trackBrokerCrm("broker_crm_ai_reply_generated", { leadId }, { userId: brokerUserId });
  return { draft };
}
