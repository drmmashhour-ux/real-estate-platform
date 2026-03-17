/**
 * Defense Analytics and Risk Intelligence – incident rates, dispute rates, fraud loss, appeals.
 * Aggregates across trust & safety, finance, compliance, legal for leadership dashboards.
 */
import { prisma } from "@/lib/db";

/** Build and optionally store a defense metrics snapshot for a date (and optional market). */
export async function buildDefenseMetricsSnapshot(params: {
  date: Date;
  marketId?: string;
  store?: boolean;
}) {
  const start = new Date(params.date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [
    disputeCount,
    bookingCount,
    fraudSignalsCount,
    abuseSignalsCount,
    suspensionCount,
    appealCount,
    appealApprovedCount,
    payoutHoldCount,
    complianceFailures,
  ] = await Promise.all([
    prisma.dispute.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.booking.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.fraudSignal.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.abuseSignal.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.enforcementAction.count({
      where: {
        actionType: "ACCOUNT_SUSPENSION",
        effectiveAt: { gte: start, lt: end },
      },
    }),
    prisma.appeal.count({ where: { submittedAt: { gte: start, lt: end } } }),
    prisma.appeal.count({
      where: { submittedAt: { gte: start, lt: end }, status: "APPROVED" },
    }),
    prisma.operationalControl.count({
      where: {
        controlType: "PAYOUT_HOLD",
        active: true,
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.complianceReview.count({
      where: { status: "NON_COMPLIANT", updatedAt: { gte: start, lt: end } },
    }),
  ]);

  const disputeRate = bookingCount > 0 ? disputeCount / bookingCount : null;
  const appealApprovalRate = appealCount > 0 ? appealApprovedCount / appealCount : null;
  const fraudLossCents = 0;

  const snapshot = {
    date: start,
    marketId: params.marketId,
    incidentCount: disputeCount + fraudSignalsCount,
    disputeCount,
    disputeRate,
    fraudLossCents,
    abuseSignalsCount,
    suspensionCount,
    appealCount,
    appealApprovalRate,
    payoutHoldCount,
    complianceFailures,
    data: {
      bookingCount,
      appealApprovedCount,
    },
  };

  if (params.store) {
    await prisma.defenseMetricsSnapshot.create({
      data: {
        date: start,
        marketId: params.marketId,
        incidentCount: snapshot.incidentCount,
        disputeCount: snapshot.disputeCount,
        disputeRate: snapshot.disputeRate,
        fraudLossCents: snapshot.fraudLossCents,
        abuseSignalsCount: snapshot.abuseSignalsCount,
        suspensionCount: snapshot.suspensionCount,
        appealCount: snapshot.appealCount,
        appealApprovalRate: snapshot.appealApprovalRate,
        payoutHoldCount: snapshot.payoutHoldCount,
        complianceFailures: snapshot.complianceFailures,
        data: snapshot.data as object,
      },
    });
  }
  return snapshot;
}

/** Get stored defense metrics snapshots. */
export async function getDefenseMetricsSnapshots(params: {
  marketId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (params.marketId) where.marketId = params.marketId;
  if (params.from || params.to) {
    where.date = {};
    if (params.from) (where.date as Record<string, Date>).gte = params.from;
    if (params.to) (where.date as Record<string, Date>).lte = params.to;
  }
  return prisma.defenseMetricsSnapshot.findMany({
    where,
    orderBy: { date: "desc" },
    take: params.limit ?? 90,
  });
}
