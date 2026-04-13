import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { getBrokerCrmLeadDetail } from "@/lib/broker-crm/get-lead";
import { trackBrokerAutopilot } from "@/lib/broker-autopilot/analytics";

const MODEL = "gpt-4o-mini";

/** AI-generated follow-up draft — editable; never sent automatically. */
export async function generateAutopilotFollowupDraft(leadId: string, brokerUserId: string): Promise<{ draft: string }> {
  const detail = await getBrokerCrmLeadDetail(leadId);
  if (!detail?.thread) throw new Error("Lead or thread not found");

  const messagesText = detail.thread.messages
    .map((m) => `${m.senderRole}: ${m.body}`)
    .join("\n");
  const listingFacts = detail.listing
    ? `Title: ${detail.listing.title}\nCode: ${detail.listing.listingCode}\nRecorded list price: ${detail.listing.price}`
    : "No listing attached.";

  const system = `You write short follow-up messages for a real-estate broker (LECIPM, Québec).
Output JSON: {"draft":string}
Rules: never invent price, inclusions, taxes, or legal claims. Label is for broker review only.
Keep it warm, concise, one follow-up nudge (reply, call, or visit coordination without promising specifics).`;

  const user = `Lead status: ${detail.status}\nListing facts (do not invent beyond):\n${listingFacts}\n\nThread:\n${messagesText}`;

  let draft: string;
  if (!isOpenAiConfigured() || !openai) {
    draft =
      "I wanted to follow up on your message and see if you had any questions I can help with. " +
      "Let me know a good time to connect.";
  } else {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
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
      draft = "Following up — happy to help whenever you’re ready.";
    }
  }

  trackBrokerAutopilot(
    "broker_autopilot_followup_draft_generated",
    { leadId },
    { userId: brokerUserId }
  );
  return { draft };
}
