import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import type { VisitSlot } from "@/lib/visits/get-available-slots";

const MODEL = "gpt-4o-mini";

/** Short message suggesting the next few slots (AI-labeled; broker still confirms). */
export async function generateVisitProposalMessage(opts: {
  listingTitle: string;
  slots: VisitSlot[];
  tone?: "friendly" | "professional";
}): Promise<{ text: string; aiGenerated: boolean }> {
  const preview = opts.slots.slice(0, 5).map((s) => {
    const a = new Date(s.start);
    return a.toLocaleString("en-CA", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  });
  const system = `You help real estate brokers propose property visit times. Output 2–4 short sentences. Do not invent listing facts or pricing. Label clearly that times are suggestions pending confirmation.`;

  const user = `Listing: ${opts.listingTitle}\nSuggested slots (local display): ${preview.join("; ") || "none"}`;

  if (!isOpenAiConfigured() || !openai) {
    return {
      text:
        preview.length > 0
          ? `Here are a few times that could work for a visit: ${preview.join("; ")}. Let me know what suits you and I’ll confirm.`
          : `I can offer a few visit times — tell me what days work for you and I’ll follow up with options.`,
      aiGenerated: false,
    };
  }

  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const text = completion.choices[0]?.message?.content?.trim() || "";
  return { text: text || preview.join("; "), aiGenerated: true };
}
