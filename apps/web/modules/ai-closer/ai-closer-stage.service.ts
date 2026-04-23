import { prisma } from "@/lib/db";

import { recordAiCloserEvent } from "./ai-closer-log.service";
import type { AiCloserStage, AiCloserStageContext } from "./ai-closer.types";

const LATE = /\b(book|visit|showing|visite|demo|calendar|this week|next week|tomorrow|schedule|quand|rdv)\b/i;
const HES = /\b(think|expensive|not sure|maybe|later|busy|email|details|compare|trop cher|pas sûr)\b/i;
const LOST = /\b(unsubscribe|stop|not interested|je ne suis pas intéressé|no thank)\b/i;
const WON = /\b(booked|confirmed|see you|à bientôt|we('ll| will) come|i('ll| will) visit)\b/i;

function textBlob(ctx: AiCloserStageContext): string {
  const m = (ctx.messages ?? []).join(" \n ");
  return [m, ctx.transcript ?? ""].filter(Boolean).join(" \n ").slice(-4000);
}

/**
 * Heuristic stage from text + optional product signals. Explainable, not ML.
 */
export function detectCloserStage(ctx: AiCloserStageContext): { stage: AiCloserStage; reasons: string[] } {
  if (ctx.optedOut) {
    return { stage: "LOST", reasons: ["opted_out"] };
  }
  const t = textBlob(ctx);
  if (!t.trim()) {
    return { stage: "AWARE", reasons: ["no_conversation_text"] };
  }
  if (LOST.test(t)) {
    return { stage: "LOST", reasons: ["negative_close_language"] };
  }
  if (WON.test(t)) {
    return { stage: "WON", reasons: ["booking_confirm_language"] };
  }
  if (/\b(human|person|agent|broker|speak to someone|parler à)\b/i.test(t)) {
    return { stage: "ESCALATE_TO_BROKER", reasons: ["human_requested_language"] };
  }
  if (/\b(law|legal|notary|title|permit|zoning|tax advice)\b/i.test(t)) {
    return { stage: "ESCALATE_TO_BROKER", reasons: ["complex_transactional_language"] };
  }

  const reasons: string[] = [];

  if (ctx.visitIntent || LATE.test(t)) {
    reasons.push("visit_or_booking_language");
    if ((ctx.bookingAttempts ?? 0) >= 1 || /\b(yes|yeah|oui|sure|ok|let's)\b/i.test(t)) {
      return { stage: "READY_TO_BOOK", reasons };
    }
    return { stage: "INTERESTED", reasons };
  }

  if (HES.test(t)) {
    reasons.push("hesitation_language");
    return { stage: "HESITATING", reasons };
  }

  if ((ctx.clickSignals ?? 0) > 3 || (ctx.timelineUrgency === "high" && t.length > 80)) {
    reasons.push("engagement_heuristic");
    return { stage: "QUALIFIED", reasons };
  }

  if (t.length > 120) {
    return { stage: "INTERESTED", reasons: ["extended_dialog"] };
  }

  return { stage: "AWARE", reasons: ["early_dialog"] };
}

export async function updateCloserStage(leadId: string, ctx: AiCloserStageContext): Promise<AiCloserStage> {
  const { stage, reasons } = detectCloserStage(ctx);
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { aiExplanation: true },
  });
  const prev = (lead?.aiExplanation as Record<string, unknown> | null) ?? {};

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      aiExplanation: {
        ...prev,
        aiCloser: {
          stage,
          reasons,
          updatedAt: new Date().toISOString(),
        },
      },
    },
  });

  await recordAiCloserEvent(leadId, "AI_CLOSER_STAGE_UPDATE", { stage, reasons });

  return stage;
}
