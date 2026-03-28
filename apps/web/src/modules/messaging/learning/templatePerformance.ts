import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { GrowthOutcomeEvent } from "@/src/modules/messaging/outcomes";
import { normDim, type LearningRoutingContext } from "@/src/modules/messaging/learning/contextKey";

export type TemplateSentArgs = LearningRoutingContext & { templateKey: string };

function compositeWhere(args: TemplateSentArgs) {
  return {
    templateKey_stage_detectedIntent_detectedObjection_highIntent: {
      templateKey: args.templateKey,
      stage: normDim(args.stage),
      detectedIntent: normDim(args.detectedIntent),
      detectedObjection: normDim(args.detectedObjection),
      highIntent: args.highIntent,
    },
  } as const;
}

export async function recordTemplateSent(args: TemplateSentArgs): Promise<void> {
  await prisma.growthAiTemplatePerformance.upsert({
    where: compositeWhere(args),
    create: {
      id: randomUUID(),
      templateKey: args.templateKey,
      stage: normDim(args.stage),
      detectedIntent: normDim(args.detectedIntent),
      detectedObjection: normDim(args.detectedObjection),
      highIntent: args.highIntent,
      sentCount: 1,
    },
    update: { sentCount: { increment: 1 } },
  });
}

type CounterField =
  | "replyCount"
  | "qualifiedCount"
  | "bookedCount"
  | "handoffCount"
  | "staleCount";

async function incrementIfRowExists(args: TemplateSentArgs, field: CounterField): Promise<void> {
  try {
    await prisma.growthAiTemplatePerformance.update({
      where: compositeWhere(args),
      data: { [field]: { increment: 1 } },
    });
  } catch {
    await prisma.growthAiTemplatePerformance.create({
      data: {
        id: randomUUID(),
        templateKey: args.templateKey,
        stage: normDim(args.stage),
        detectedIntent: normDim(args.detectedIntent),
        detectedObjection: normDim(args.detectedObjection),
        highIntent: args.highIntent,
        sentCount: 0,
        [field]: 1,
      },
    });
  }
}

export async function recordTemplateReply(args: TemplateSentArgs): Promise<void> {
  await incrementIfRowExists(args, "replyCount");
}

export async function recordTemplateQualified(args: TemplateSentArgs): Promise<void> {
  await incrementIfRowExists(args, "qualifiedCount");
}

export async function recordTemplateBooked(args: TemplateSentArgs): Promise<void> {
  await incrementIfRowExists(args, "bookedCount");
}

export async function recordTemplateHandoff(args: TemplateSentArgs): Promise<void> {
  await incrementIfRowExists(args, "handoffCount");
}

export async function recordTemplateStale(args: TemplateSentArgs): Promise<void> {
  await incrementIfRowExists(args, "staleCount");
}

export function derivedRates(row: {
  sentCount: number;
  replyCount: number;
  qualifiedCount: number;
  bookedCount: number;
  handoffCount: number;
  staleCount: number;
}) {
  const s = Math.max(1, row.sentCount);
  return {
    replyRate: row.replyCount / s,
    qualifiedRate: row.qualifiedCount / s,
    bookedRate: row.bookedCount / s,
    staleRate: row.staleCount / s,
    handoffRate: row.handoffCount / s,
  };
}

export function weightedScore(row: {
  sentCount: number;
  replyCount: number;
  qualifiedCount: number;
  bookedCount: number;
  handoffCount: number;
  staleCount: number;
}): number {
  const r = derivedRates(row);
  return (
    r.bookedRate * 5 +
    r.qualifiedRate * 3 +
    r.replyRate * 2 -
    r.staleRate * 2 -
    r.handoffRate * 3
  );
}

/** Rebuild rollup rows from decisions + outcome ledger (periodic job). */
export async function recomputeTemplatePerformanceWindow(windowDays = 90): Promise<{ rowsUpserted: number }> {
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const decisions = await prisma.growthAiConversationDecision.findMany({
    where: { createdAt: { gte: cutoff } },
    select: {
      selectedTemplateKey: true,
      stage: true,
      detectedIntent: true,
      detectedObjection: true,
      highIntent: true,
    },
  });

  const tally = new Map<
    string,
    {
      templateKey: string;
      stage: string;
      detectedIntent: string;
      detectedObjection: string;
      highIntent: boolean;
      sent: number;
    }
  >();

  for (const d of decisions) {
    const stage = normDim(d.stage);
    const intent = normDim(d.detectedIntent);
    const objection = normDim(d.detectedObjection);
    const key = `${d.selectedTemplateKey}|${stage}|${intent}|${objection}|${d.highIntent}`;
    const cur = tally.get(key) ?? {
      templateKey: d.selectedTemplateKey,
      stage,
      detectedIntent: intent,
      detectedObjection: objection,
      highIntent: d.highIntent,
      sent: 0,
    };
    cur.sent += 1;
    tally.set(key, cur);
  }

  const events = await prisma.growthAiTemplateOutcomeEvent.findMany({
    where: { createdAt: { gte: cutoff } },
  });

  const outcomeTally = new Map<
    string,
    { reply: number; qualified: number; booked: number; handoff: number; stale: number }
  >();

  for (const ev of events) {
    const decision = ev.decisionId
      ? await prisma.growthAiConversationDecision.findUnique({
          where: { id: ev.decisionId },
          select: {
            selectedTemplateKey: true,
            stage: true,
            detectedIntent: true,
            detectedObjection: true,
            highIntent: true,
          },
        })
      : await prisma.growthAiConversationDecision.findFirst({
          where: { conversationId: ev.conversationId },
          orderBy: { createdAt: "desc" },
          select: {
            selectedTemplateKey: true,
            stage: true,
            detectedIntent: true,
            detectedObjection: true,
            highIntent: true,
          },
        });
    if (!decision) continue;

    const stage = normDim(decision.stage);
    const intent = normDim(decision.detectedIntent);
    const objection = normDim(decision.detectedObjection);
    const key = `${decision.selectedTemplateKey}|${stage}|${intent}|${objection}|${decision.highIntent}`;
    const bucket = outcomeTally.get(key) ?? { reply: 0, qualified: 0, booked: 0, handoff: 0, stale: 0 };

    if (ev.eventKey === "outcome:replied") bucket.reply += 1;
    else if (ev.eventKey === "outcome:qualified" || ev.eventKey === "outcome:call_scheduled")
      bucket.qualified += 1;
    else if (ev.eventKey === "outcome:booked") bucket.booked += 1;
    else if (ev.eventKey === "outcome:handoff") bucket.handoff += 1;
    else if (ev.eventKey === "outcome:stale") bucket.stale += 1;

    outcomeTally.set(key, bucket);
  }

  let rowsUpserted = 0;
  for (const [, v] of tally) {
    const o = outcomeTally.get(
      `${v.templateKey}|${v.stage}|${v.detectedIntent}|${v.detectedObjection}|${v.highIntent}`
    ) ?? { reply: 0, qualified: 0, booked: 0, handoff: 0, stale: 0 };

    await prisma.growthAiTemplatePerformance.upsert({
      where: {
        templateKey_stage_detectedIntent_detectedObjection_highIntent: {
          templateKey: v.templateKey,
          stage: v.stage,
          detectedIntent: v.detectedIntent,
          detectedObjection: v.detectedObjection,
          highIntent: v.highIntent,
        },
      },
      create: {
        id: randomUUID(),
        templateKey: v.templateKey,
        stage: v.stage,
        detectedIntent: v.detectedIntent,
        detectedObjection: v.detectedObjection,
        highIntent: v.highIntent,
        sentCount: v.sent,
        replyCount: o.reply,
        qualifiedCount: o.qualified,
        bookedCount: o.booked,
        handoffCount: o.handoff,
        staleCount: o.stale,
      },
      update: {
        sentCount: v.sent,
        replyCount: o.reply,
        qualifiedCount: o.qualified,
        bookedCount: o.booked,
        handoffCount: o.handoff,
        staleCount: o.stale,
      },
    });
    rowsUpserted++;
  }

  return { rowsUpserted };
}

export type DecisionSnapshot = {
  selectedTemplateKey: string;
  stage: string | null;
  detectedIntent: string | null;
  detectedObjection: string | null;
  highIntent: boolean;
};

export function contextFromDecision(d: DecisionSnapshot): TemplateSentArgs {
  return {
    templateKey: d.selectedTemplateKey,
    stage: normDim(d.stage),
    detectedIntent: normDim(d.detectedIntent),
    detectedObjection: normDim(d.detectedObjection),
    highIntent: d.highIntent,
  };
}

/**
 * Idempotent outcome → performance counters (ledger prevents double count).
 */
export async function applyLearningOutcomeFeedback(
  conversationId: string,
  newOutcome: string,
  _eventType: GrowthOutcomeEvent
): Promise<void> {
  const ledgerKey = `outcome:${newOutcome}`;
  const decision = await prisma.growthAiConversationDecision.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
  });

  try {
    await prisma.growthAiTemplateOutcomeEvent.create({
      data: {
        conversationId,
        eventKey: ledgerKey,
        decisionId: decision?.id ?? null,
      },
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code: string }).code : "";
    if (code === "P2002") return;
    throw e;
  }

  if (!decision) return;
  const ctx = contextFromDecision(decision);

  switch (newOutcome) {
    case "replied":
      await recordTemplateReply(ctx);
      break;
    case "qualified":
    case "call_scheduled":
      await recordTemplateQualified(ctx);
      break;
    case "booked":
      await recordTemplateBooked(ctx);
      break;
    case "handoff":
      await recordTemplateHandoff(ctx);
      break;
    case "stale":
      await recordTemplateStale(ctx);
      break;
    default:
      break;
  }
}
