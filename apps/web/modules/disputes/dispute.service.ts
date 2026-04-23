import type { PlatformRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  buildAssistiveSummary,
  getDisputeDetailForUser,
  getDisputeMetrics,
  listDisputesForUser,
} from "@/modules/dispute-room/dispute-case.service";

import { buildUnifiedDisputeTimeline } from "./dispute-timeline.service";
import type { DisputeObservabilityMetrics, RelatedEntityLabel } from "./dispute.types";

export {
  createDisputeCase,
  DISPUTE_COMPLIANCE_FOOTER,
  parseDisputeCreateBody,
  parseStatusBody,
} from "@/modules/dispute-room/dispute-case.service";

export async function getDisputeWorkspaceDetail(input: {
  disputeId: string;
  userId: string;
  role: PlatformRole;
}) {
  const detail = await getDisputeDetailForUser(input);
  if (!detail.ok) return detail;

  const timeline = await buildUnifiedDisputeTimeline(detail.dispute);
  const relatedLabel = formatRelatedEntityLabel(detail.dispute);

  return { ok: true as const, dispute: detail.dispute, timeline, relatedLabel };
}

export async function loadDisputeObservabilityMetrics(): Promise<DisputeObservabilityMetrics> {
  const since30 = new Date(Date.now() - 30 * 86400000);

  const [total, byStatus, byCategory, resolved, bookings30, openCount, disputesBooking30] =
    await Promise.all([
      prisma.lecipmDisputeCase.count(),
      prisma.lecipmDisputeCase.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.lecipmDisputeCase.groupBy({
        by: ["category"],
        _count: { _all: true },
      }),
      prisma.lecipmDisputeCase.findMany({
        where: { status: "RESOLVED", resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
        take: 500,
        orderBy: { resolvedAt: "desc" },
      }),
      prisma.booking.count({ where: { createdAt: { gte: since30 } } }).catch(() => 0),
      prisma.lecipmDisputeCase.count({
        where: { status: { in: ["OPEN", "IN_REVIEW", "ESCALATED"] } },
      }),
      prisma.lecipmDisputeCase.count({
        where: {
          relatedEntityType: "BOOKING",
          createdAt: { gte: since30 },
        },
      }),
    ]);

  const resolutionMs = resolved
    .map((r) => (r.resolvedAt!.getTime() - r.createdAt.getTime()) / 86400000)
    .filter((x) => Number.isFinite(x) && x >= 0);
  const avgDays =
    resolutionMs.length > 0 ?
      resolutionMs.reduce((a, b) => a + b, 0) / resolutionMs.length
    : null;

  const topCauses = [...byCategory]
    .map((c) => ({ category: c.category, count: c._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    totalOpen: openCount,
    total,
    byStatus,
    byCategory,
    avgResolutionDays: avgDays,
    sampleSize: resolutionMs.length,
    disputesLast30dBooking: disputesBooking30,
    bookingsLast30d: bookings30,
    disputeRatePerBooking30d: bookings30 > 0 ? disputesBooking30 / bookings30 : null,
    topCauses,
    conversionImpactNote:
      "Dispute rate vs bookings is directional — tie to conversion when attribution warehouse links cases to funnel IDs.",
  };
}

export { buildAssistiveSummary, getDisputeMetrics, listDisputesForUser };

function formatRelatedEntityLabel(d: {
  relatedEntityType: RelatedEntityLabel["type"];
  relatedEntityId: string;
}): RelatedEntityLabel {
  const short = d.relatedEntityId.length > 10 ? `${d.relatedEntityId.slice(0, 8)}…` : d.relatedEntityId;
  return {
    type: d.relatedEntityType,
    id: d.relatedEntityId,
    label: `${d.relatedEntityType} · ${short}`,
  };
}
