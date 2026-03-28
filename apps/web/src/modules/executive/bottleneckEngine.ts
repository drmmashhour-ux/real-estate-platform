import { prisma } from "@/lib/db";
import { derivedRates } from "@/src/modules/messaging/learning/templatePerformance";
import {
  executiveHighHandoffRateThreshold,
  executiveHighStaleRateThreshold,
  executiveLowHighIntentConversionThreshold,
  executiveLowReplyRateThreshold,
} from "@/src/modules/executive/executiveEnv";

export type ExecutiveBottleneck = {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  evidence: Record<string, unknown>;
  affectedEntity: { entityType: string; entityId: string };
  suggestedResponseAreas: string[];
};

export async function detectMessagingBottlenecks(): Promise<ExecutiveBottleneck[]> {
  const out: ExecutiveBottleneck[] = [];
  const start = new Date(Date.now() - 30 * 86400000);
  const convs = await prisma.growthAiConversation.count({ where: { createdAt: { gte: start } } });
  const withAi = await prisma.growthAiConversation.count({
    where: { createdAt: { gte: start }, lastAiMessageAt: { not: null } },
  });
  const withUser = await prisma.growthAiConversation.count({
    where: { createdAt: { gte: start }, lastUserMessageAt: { not: null } },
  });
  const replyRate = withAi / Math.max(1, withUser || convs);
  const lowReply = executiveLowReplyRateThreshold();
  if (replyRate < lowReply && convs >= 10) {
    out.push({
      type: "low_reply_rate",
      severity: replyRate < lowReply * 0.5 ? "critical" : "high",
      evidence: { replyRate, sampleWindowDays: 30, conversations: convs },
      affectedEntity: { entityType: "global", entityId: "messaging" },
      suggestedResponseAreas: ["auto_reply_worker", "cron_health", "AI_AUTO_REPLY_ENABLED"],
    });
  }
  return out;
}

export async function detectConversionBottlenecks(): Promise<ExecutiveBottleneck[]> {
  const out: ExecutiveBottleneck[] = [];
  const start = new Date(Date.now() - 30 * 86400000);
  const [total, booked, stale, handoff, hi, hiBooked] = await Promise.all([
    prisma.growthAiConversation.count({ where: { createdAt: { gte: start } } }),
    prisma.growthAiConversation.count({ where: { createdAt: { gte: start }, outcome: "booked" } }),
    prisma.growthAiConversation.count({ where: { createdAt: { gte: start }, outcome: "stale" } }),
    prisma.growthAiConversation.count({ where: { createdAt: { gte: start }, outcome: "handoff" } }),
    prisma.growthAiConversation.count({ where: { createdAt: { gte: start }, highIntent: true } }),
    prisma.growthAiConversation.count({
      where: { createdAt: { gte: start }, highIntent: true, outcome: "booked" },
    }),
  ]);
  const n = Math.max(1, total);
  const staleRate = stale / n;
  const handoffRate = handoff / n;
  const hiConv = hi > 0 ? hiBooked / hi : 0;

  if (staleRate >= executiveHighStaleRateThreshold() && total >= 15) {
    out.push({
      type: "high_stale_rate",
      severity: staleRate > 0.65 ? "critical" : "high",
      evidence: { staleRate, staleCount: stale, total },
      affectedEntity: { entityType: "global", entityId: "conversion" },
      suggestedResponseAreas: ["nudge_templates", "stage_refresh", "human_follow_up"],
    });
  }
  if (handoffRate >= executiveHighHandoffRateThreshold() && total >= 15) {
    out.push({
      type: "high_handoff_rate",
      severity: "medium",
      evidence: { handoffRate, handoffCount: handoff, total },
      affectedEntity: { entityType: "global", entityId: "trust_and_support" },
      suggestedResponseAreas: ["classifier_handoffs", "payment_lines", "trust_templates"],
    });
  }
  if (hi >= 20 && hiConv < executiveLowHighIntentConversionThreshold()) {
    out.push({
      type: "low_high_intent_conversion",
      severity: "high",
      evidence: { highIntentCount: hi, highIntentBooked: hiBooked, rate: hiConv },
      affectedEntity: { entityType: "global", entityId: "high_intent_closing" },
      suggestedResponseAreas: ["assist_close", "closing_push", "orchestration_assign"],
    });
  }
  const closingStall = await prisma.growthAiConversation.count({
    where: { createdAt: { gte: start }, stage: "closing", outcome: { notIn: ["booked", "lost", "handoff"] } },
  });
  if (closingStall >= 10) {
    out.push({
      type: "closing_stage_stall",
      severity: "medium",
      evidence: { openClosingCount: closingStall },
      affectedEntity: { entityType: "stage", entityId: "closing" },
      suggestedResponseAreas: ["closing_nudge", "closing_push", "broker_call"],
    });
  }
  return out;
}

export async function detectAssignmentBottlenecks(): Promise<ExecutiveBottleneck[]> {
  const out: ExecutiveBottleneck[] = [];
  try {
    const overdue = await prisma.growthAiLeadOrchestration.count({
      where: {
        assignmentStatus: { in: ["assigned", "contacted"] },
        assignedAt: { lt: new Date(Date.now() - 2 * 60 * 60_000) },
      },
    });
    if (overdue >= 5) {
      out.push({
        type: "assignment_queue_backlog",
        severity: "high",
        evidence: { overdueSuspected: overdue },
        affectedEntity: { entityType: "global", entityId: "assignment" },
        suggestedResponseAreas: ["orchestration_worker", "sla_reassign", "admin_inbox"],
      });
    }
  } catch {
    /* orchestration table missing */
  }
  return out;
}

export async function detectBrokerSlaBottlenecks(): Promise<ExecutiveBottleneck[]> {
  const out: ExecutiveBottleneck[] = [];
  const slow = await prisma.executiveEntityScore.findMany({
    where: { entityType: "broker", scoreType: "responsiveness", scoreValue: { lt: 0.4 } },
    take: 12,
    orderBy: { scoreValue: "asc" },
  });
  for (const s of slow) {
    out.push({
      type: "broker_slow_response",
      severity: "medium",
      evidence: { brokerId: s.entityId, responsiveness: s.scoreValue, ...(s.evidenceJson as object) },
      affectedEntity: { entityType: "broker", entityId: s.entityId },
      suggestedResponseAreas: ["assignment_rules", "manual_coaching", "reduce_auto_assign"],
    });
  }
  return out;
}

export async function detectHostSlaBottlenecks(): Promise<ExecutiveBottleneck[]> {
  const out: ExecutiveBottleneck[] = [];
  const slow = await prisma.executiveEntityScore.findMany({
    where: { entityType: "host", scoreType: "responsiveness", scoreValue: { lt: 0.4 } },
    take: 12,
    orderBy: { scoreValue: "asc" },
  });
  for (const s of slow) {
    out.push({
      type: "host_slow_response",
      severity: "medium",
      evidence: { hostId: s.entityId, responsiveness: s.scoreValue },
      affectedEntity: { entityType: "host", entityId: s.entityId },
      suggestedResponseAreas: ["host_notifications", "booking_sla", "orchestration_host"],
    });
  }
  return out;
}

export async function detectCityBottlenecks(): Promise<ExecutiveBottleneck[]> {
  const out: ExecutiveBottleneck[] = [];
  const cities = await prisma.executiveEntityScore.findMany({
    where: { entityType: "city", scoreType: "conversion" },
    take: 80,
  });
  for (const c of cities) {
    const conv = c.scoreValue;
    const ev = c.evidenceJson as { volume?: number; highIntentRate?: number } | null;
    if (ev && (ev.volume ?? 0) >= 15 && conv < 0.08 && (ev.highIntentRate ?? 0) > 0.15) {
      out.push({
        type: "city_demand_conversion_gap",
        severity: "high",
        evidence: { city: c.entityId, conversionRate: conv, ...ev },
        affectedEntity: { entityType: "city", entityId: c.entityId },
        suggestedResponseAreas: ["bnhub_trust_copy", "local_templates", "payment_clarity"],
      });
    }
  }
  return out;
}

export async function detectListingBottlenecks(): Promise<ExecutiveBottleneck[]> {
  const out: ExecutiveBottleneck[] = [];
  const rows = await prisma.executiveEntityScore.findMany({
    where: { entityType: "listing", scoreType: "priority" },
    orderBy: { scoreValue: "desc" },
    take: 30,
  });
  for (const r of rows) {
    const ev = r.evidenceJson as { hi?: number; n?: number; stale?: number } | null;
    if (ev && (ev.n ?? 0) >= 4 && ev.hi && ev.hi >= 3 && (ev.stale ?? 0) > 0) {
      out.push({
        type: "listing_high_intent_stale",
        severity: "medium",
        evidence: { listingId: r.entityId, ...ev },
        affectedEntity: { entityType: "listing", entityId: r.entityId },
        suggestedResponseAreas: ["listing_cta", "broker_assign", "pricing_clarity"],
      });
    }
  }
  return out;
}

export async function detectTemplateBottlenecks(): Promise<ExecutiveBottleneck[]> {
  const out: ExecutiveBottleneck[] = [];
  const rows = await prisma.growthAiTemplatePerformance.findMany({
    where: { sentCount: { gte: 15 } },
    take: 60,
  });
  for (const r of rows) {
    const dr = derivedRates(r);
    if (dr.staleRate > 0.45 || (dr.handoffRate > 0.25 && r.detectedObjection !== "none")) {
      out.push({
        type: "template_weak_bucket",
        severity: dr.staleRate > 0.55 ? "high" : "medium",
        evidence: {
          templateKey: r.templateKey,
          stage: r.stage,
          intent: r.detectedIntent,
          objection: r.detectedObjection,
          rates: dr,
          sentCount: r.sentCount,
        },
        affectedEntity: { entityType: "template", entityId: r.templateKey },
        suggestedResponseAreas: ["template_copy", "self_learning_override", "experiment_variant"],
      });
    }
  }
  return out;
}

export async function detectAllBottlenecks(): Promise<ExecutiveBottleneck[]> {
  const parts = await Promise.all([
    detectMessagingBottlenecks(),
    detectConversionBottlenecks(),
    detectAssignmentBottlenecks(),
    detectBrokerSlaBottlenecks(),
    detectHostSlaBottlenecks(),
    detectCityBottlenecks(),
    detectListingBottlenecks(),
    detectTemplateBottlenecks(),
  ]);
  return parts.flat();
}
