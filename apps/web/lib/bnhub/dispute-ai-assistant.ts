import { prisma } from "@/lib/db";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";

export type DisputeAiRecommendation = "REFUND" | "NO_ACTION";

export type DisputeAiResult = {
  recommendation: DisputeAiRecommendation;
  summary: string;
  source: "openai" | "rules";
};

function rulesFallback(input: {
  description: string;
  checklistConfirmedRatio: number | null;
  messageCount: number;
}): DisputeAiResult {
  const d = input.description.toLowerCase();
  const safety =
    d.includes("unsafe") ||
    d.includes("danger") ||
    d.includes("assault") ||
    d.includes("broken") ||
    d.includes("not as described") ||
    d.includes("infestation");
  const minor = d.includes("noise") || d.includes("wifi") || d.includes("towel");

  if (safety) {
    return {
      recommendation: "REFUND",
      summary:
        "Rule-based: complaint language suggests safety or material misrepresentation — recommend human review and likely partial/full refund path.",
      source: "rules",
    };
  }
  if (minor && (input.checklistConfirmedRatio ?? 1) >= 0.8) {
    return {
      recommendation: "NO_ACTION",
      summary:
        "Rule-based: minor issues with strong checklist confirmation — consider goodwill credit instead of refund unless escalation.",
      source: "rules",
    };
  }
  if ((input.checklistConfirmedRatio ?? 0) < 0.4) {
    return {
      recommendation: "REFUND",
      summary:
        "Rule-based: many checklist items not confirmed — higher risk the stay did not match expectations; favor guest-friendly resolution.",
      source: "rules",
    };
  }
  return {
    recommendation: "NO_ACTION",
    summary:
      "Rule-based: insufficient automated signal — default to manual review; no automatic refund recommendation.",
    source: "rules",
  };
}

/**
 * Produce a non-binding assistant suggestion for admins (messages + checklist + booking facts).
 */
export async function analyzeDisputeForAssistant(disputeId: string): Promise<DisputeAiResult> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    select: {
      id: true,
      description: true,
      status: true,
      bookingId: true,
      booking: {
        select: {
          checkIn: true,
          checkOut: true,
          nights: true,
          totalCents: true,
          status: true,
          specialRequest: true,
          listing: { select: { title: true, city: true } },
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  const [messages, checklist, thread] = await Promise.all([
    prisma.bookingMessage.findMany({
      where: { bookingId: dispute.bookingId },
      orderBy: { createdAt: "asc" },
      take: 80,
      select: { body: true, senderId: true, createdAt: true },
    }),
    prisma.bnhubBookingChecklistItem.findMany({
      where: { bookingId: dispute.bookingId },
      select: { itemKey: true, confirmed: true, note: true },
    }),
    prisma.disputeMessage.findMany({
      where: { disputeId, isInternal: false },
      orderBy: { createdAt: "asc" },
      take: 40,
      select: { body: true, senderId: true, createdAt: true },
    }),
  ]);

  const totalItems = checklist.length;
  const confirmedOk = checklist.filter((c) => c.confirmed === true).length;
  const checklistConfirmedRatio = totalItems > 0 ? confirmedOk / totalItems : null;

  const transcript = messages
    .map((m) => `[${m.createdAt.toISOString().slice(0, 10)}] ${m.body.slice(0, 500)}`)
    .join("\n");
  const disputeThread = thread.map((m) => m.body.slice(0, 500)).join("\n");

  if (!isOpenAiConfigured()) {
    return rulesFallback({
      description: dispute.description,
      checklistConfirmedRatio,
      messageCount: messages.length,
    });
  }

  const bookingFacts = JSON.stringify({
    listing: dispute.booking.listing,
    nights: dispute.booking.nights,
    totalCents: dispute.booking.totalCents,
    status: dispute.booking.status,
    checkIn: dispute.booking.checkIn.toISOString(),
    checkOut: dispute.booking.checkOut.toISOString(),
    specialRequest: dispute.booking.specialRequest,
  });

  const prompt = `You are a trust & safety assistant for short-term rentals. Read the dispute description, booking facts, guest-host message transcript, dispute thread, and checklist summary.
Respond with JSON only: {"recommendation":"REFUND"|"NO_ACTION","summary":"2-4 sentences, neutral tone, for admin only — not legal advice"}.

Dispute description:
${dispute.description}

Booking facts:
${bookingFacts}

Checklist: ${confirmedOk}/${totalItems} items confirmed true (ratio ${checklistConfirmedRatio ?? "n/a"}).

Booking messages (chronological, truncated):
${transcript || "(none)"}

Dispute thread:
${disputeThread || "(none)"}`;

  try {
    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_DISPUTE_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Output valid JSON only. recommendation must be REFUND or NO_ACTION." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });
    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(raw) as { recommendation?: string; summary?: string };
    const rec =
      parsed.recommendation === "REFUND" || parsed.recommendation === "NO_ACTION"
        ? parsed.recommendation
        : "NO_ACTION";
    const summary =
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : "Model returned empty summary.";
    return { recommendation: rec, summary, source: "openai" };
  } catch {
    return rulesFallback({
      description: dispute.description,
      checklistConfirmedRatio,
      messageCount: messages.length,
    });
  }
}
