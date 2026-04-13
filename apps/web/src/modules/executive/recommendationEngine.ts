import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { ExecutiveBottleneck } from "@/src/modules/executive/bottleneckEngine";
import { executiveRecommendationMinPriority } from "@/src/modules/executive/executiveEnv";

export type ExecutiveRecommendationInput = {
  recommendationType: string;
  priorityScore: number;
  title: string;
  summary: string;
  detailsJson: Prisma.InputJsonValue;
  evidenceJson?: Prisma.InputJsonValue;
  targetEntityType?: string;
  targetEntityId?: string;
  safeAutoActionKey?: string;
};

const severityRank: Record<string, number> = { critical: 100, high: 75, medium: 50, low: 25 };

export function buildRecommendationFromBottleneck(b: ExecutiveBottleneck): ExecutiveRecommendationInput | null {
  const base = severityRank[b.severity] ?? 40;
  switch (b.type) {
    case "low_reply_rate":
      return {
        recommendationType: "messaging",
        priorityScore: base + 10,
        title: "Growth AI reply rate is below target",
        summary:
          "A low share of conversations received an AI reply in the last 30 days. Verify auto-reply worker cron and AI_AUTO_REPLY_ENABLED.",
        detailsJson: { bottleneckType: b.type, areas: b.suggestedResponseAreas },
        evidenceJson: b.evidence as Prisma.InputJsonValue,
        targetEntityType: "global",
        targetEntityId: "messaging",
        safeAutoActionKey: "internal_admin_notify",
      };
    case "high_stale_rate":
      return {
        recommendationType: "conversion",
        priorityScore: base + 5,
        title: "Stale conversation rate is elevated",
        summary:
          "Many threads are aging out without progression. Consider stronger follow-up templates, orchestration nudges, or human review for high-intent stale threads.",
        detailsJson: { bottleneckType: b.type, areas: b.suggestedResponseAreas },
        evidenceJson: b.evidence as Prisma.InputJsonValue,
        targetEntityType: "global",
        targetEntityId: "conversion",
        safeAutoActionKey: "mark_manual_review_global",
      };
    case "high_handoff_rate":
      return {
        recommendationType: "routing",
        priorityScore: base,
        title: "Handoff rate suggests trust or support pressure",
        summary:
          "Review classifier handoff triggers and trust/payment-sensitive lines; ensure inbox staffing matches volume.",
        detailsJson: { bottleneckType: b.type, areas: b.suggestedResponseAreas },
        evidenceJson: b.evidence as Prisma.InputJsonValue,
        targetEntityType: "global",
        targetEntityId: "routing",
      };
    case "low_high_intent_conversion":
      return {
        recommendationType: "conversion",
        priorityScore: base + 15,
        title: "High-intent threads under-convert to booked",
        summary:
          "Prioritize assist_close and closing templates for booking flow; consider faster broker/host assignment for buyer high-intent routes.",
        detailsJson: { bottleneckType: b.type, areas: b.suggestedResponseAreas },
        evidenceJson: b.evidence as Prisma.InputJsonValue,
        targetEntityType: "global",
        targetEntityId: "high_intent",
        safeAutoActionKey: "raise_template_priority_context",
      };
    case "closing_stage_stall":
      return {
        recommendationType: "conversion",
        priorityScore: base,
        title: "Conversations stuck in closing stage",
        summary: "Test closing_nudge / closing_push and learning overrides for buyer_interest + high_intent contexts.",
        detailsJson: { bottleneckType: b.type, areas: b.suggestedResponseAreas },
        evidenceJson: b.evidence as Prisma.InputJsonValue,
        targetEntityType: "stage",
        targetEntityId: "closing",
      };
    case "assignment_queue_backlog":
      return {
        recommendationType: "assignment",
        priorityScore: base + 10,
        title: "Assignment backlog or SLA risk in orchestration",
        summary:
          "Review autonomous deal closer worker, SLA env flags, and admin inbox coverage for assigned threads.",
        detailsJson: { bottleneckType: b.type, areas: b.suggestedResponseAreas },
        evidenceJson: b.evidence as Prisma.InputJsonValue,
        targetEntityType: "global",
        targetEntityId: "assignment",
      };
    case "broker_slow_response":
      return {
        recommendationType: "broker_sla",
        priorityScore: base,
        title: `Broker ${b.affectedEntity.entityId.slice(0, 8)}… response responsiveness is weak`,
        summary:
          "Consider lowering automatic assignment priority for this broker until responsiveness improves (safe action when auto-actions enabled).",
        detailsJson: { bottleneckType: b.type, areas: b.suggestedResponseAreas },
        evidenceJson: b.evidence as Prisma.InputJsonValue,
        targetEntityType: "broker",
        targetEntityId: b.affectedEntity.entityId,
        safeAutoActionKey: "lower_broker_assignment_priority",
      };
    case "host_slow_response":
      return {
        recommendationType: "host_sla",
        priorityScore: base,
        title: `Host ${b.affectedEntity.entityId.slice(0, 8)}… responsiveness is weak`,
        summary: "Review BNHUB host alerts and orchestration host assignment; optional safe deprioritization when enabled.",
        detailsJson: { bottleneckType: b.type, areas: b.suggestedResponseAreas },
        evidenceJson: b.evidence as Prisma.InputJsonValue,
        targetEntityType: "host",
        targetEntityId: b.affectedEntity.entityId,
        safeAutoActionKey: "lower_host_assignment_priority",
      };
    case "city_demand_conversion_gap":
      return {
        recommendationType: "city_expansion",
        priorityScore: base + 5,
        title: `City ${b.affectedEntity.entityId}: strong interest, weak conversion`,
        summary:
          "Prioritize trust and payment clarity on BNHUB flows for this city; consider localized template experiments.",
        detailsJson: { bottleneckType: b.type, areas: b.suggestedResponseAreas },
        evidenceJson: b.evidence as Prisma.InputJsonValue,
        targetEntityType: "city",
        targetEntityId: b.affectedEntity.entityId,
        safeAutoActionKey: "mark_city_manual_review",
      };
    case "listing_high_intent_stale":
      return {
        recommendationType: "listing_priority",
        priorityScore: base,
        title: `Listing ${b.affectedEntity.entityId}: high-intent signal with stale risk`,
        summary: "Manual review: CTA, broker linkage, and checkout friction for this listing.",
        detailsJson: { bottleneckType: b.type, areas: b.suggestedResponseAreas },
        evidenceJson: b.evidence as Prisma.InputJsonValue,
        targetEntityType: "listing",
        targetEntityId: b.affectedEntity.entityId,
        safeAutoActionKey: "mark_listing_manual_review",
      };
    case "template_weak_bucket": {
      const ev = b.evidence as Record<string, unknown>;
      const tk = typeof ev.templateKey === "string" ? ev.templateKey : b.affectedEntity.entityId;
      return {
        recommendationType: "objection_fix",
        priorityScore: base,
        title: `Template bucket underperforming: ${tk}`,
        summary:
          "Compare with trust_with_action / timing variants; consider a manual learning override or experiment.",
        detailsJson: { bottleneckType: b.type, areas: b.suggestedResponseAreas },
        evidenceJson: b.evidence as Prisma.InputJsonValue,
        targetEntityType: "template",
        targetEntityId: String(tk),
        safeAutoActionKey: "lower_template_priority_context",
      };
    }
    default:
      return {
        recommendationType: "routing",
        priorityScore: base,
        title: `Operational bottleneck: ${b.type}`,
        summary: "Review evidence and suggested response areas in details.",
        detailsJson: { bottleneckType: b.type, areas: b.suggestedResponseAreas },
        evidenceJson: b.evidence as Prisma.InputJsonValue,
        targetEntityType: b.affectedEntity.entityType,
        targetEntityId: b.affectedEntity.entityId,
      };
  }
}

export function rankRecommendations(recs: ExecutiveRecommendationInput[]): ExecutiveRecommendationInput[] {
  return [...recs].sort((a, b) => b.priorityScore - a.priorityScore);
}

export async function saveExecutiveRecommendations(recs: ExecutiveRecommendationInput[]): Promise<number> {
  const minP = executiveRecommendationMinPriority();
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  let inserted = 0;
  for (const r of recs) {
    if (r.priorityScore < minP) continue;
    const dup = await prisma.executiveRecommendation.findFirst({
      where: {
        title: r.title,
        status: "open",
        createdAt: { gte: since },
      },
    });
    if (dup) continue;
    await prisma.executiveRecommendation.create({
      data: {
        id: randomUUID(),
        recommendationType: r.recommendationType,
        priorityScore: r.priorityScore,
        status: "open",
        title: r.title,
        summary: r.summary,
        detailsJson: r.detailsJson,
        evidenceJson: r.evidenceJson ?? undefined,
        targetEntityType: r.targetEntityType,
        targetEntityId: r.targetEntityId,
        safeAutoActionKey: r.safeAutoActionKey,
      },
    });
    inserted++;
  }
  return inserted;
}

export async function generateExecutiveRecommendations(
  bottlenecks: ExecutiveBottleneck[]
): Promise<ExecutiveRecommendationInput[]> {
  const mapped = bottlenecks.map(buildRecommendationFromBottleneck).filter(Boolean) as ExecutiveRecommendationInput[];
  return rankRecommendations(mapped);
}
