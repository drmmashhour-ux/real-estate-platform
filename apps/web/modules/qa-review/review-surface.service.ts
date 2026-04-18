import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { complianceAdminFlags } from "@/config/feature-flags";

export type DealReviewSurfacePayload =
  | { enabled: false }
  | {
      enabled: true;
      visible: false;
    }
  | {
      enabled: true;
      visible: true;
      disclaimer: string;
      /** Broker-safe: no internal finding text */
      qaSummary: {
        reviews: Array<{
          id: string;
          reviewType: string;
          status: string;
          outcome: string | null;
          updatedAt: string;
        }>;
      };
      complianceSummary: {
        openInternalCases: number;
        hasEscalatedOrCriticalAttention: boolean;
      };
      /** Admin/supervisor-only structured notes from reviews */
      supervisorNotes?: Array<{ reviewId: string; notes: Record<string, unknown> }>;
    };

const BROKER_DISCLAIMER =
  "Internal brokerage QA and compliance signals are supervisory tools. They are not legal conclusions or regulatory determinations.";

/**
 * Broker of record (or platform admin previewing the deal) sees aggregate QA/compliance status.
 * Buyers/sellers and other parties do not receive this surface (prevents client leakage of internal ops).
 */
export async function getDealReviewSurfaceForViewer(input: {
  dealId: string;
  viewerUserId: string;
  viewerRole: PlatformRole;
}): Promise<DealReviewSurfacePayload> {
  const flagsOn =
    complianceAdminFlags.brokerageQaReviewV1 || complianceAdminFlags.adminComplianceCommandCenterV1;
  if (!flagsOn) {
    return { enabled: false };
  }

  const deal = await prisma.deal.findFirst({
    where: {
      id: input.dealId,
      OR: [{ brokerId: input.viewerUserId }, { buyerId: input.viewerUserId }, { sellerId: input.viewerUserId }],
    },
    select: { id: true, brokerId: true },
  });
  if (!deal) {
    return { enabled: false };
  }

  const isAssignedBroker = deal.brokerId === input.viewerUserId;
  const isAdmin = input.viewerRole === "ADMIN";
  if (!isAssignedBroker && !isAdmin) {
    return { enabled: true, visible: false };
  }

  const [reviews, openCases, escalatedAttention] = await Promise.all([
    prisma.qaReview.findMany({
      where: { dealId: input.dealId },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        reviewType: true,
        status: true,
        outcome: true,
        updatedAt: true,
        notes: true,
      },
    }),
    prisma.complianceCase.count({
      where: {
        dealId: input.dealId,
        status: { in: ["open", "under_review", "action_required", "escalated"] },
      },
    }),
    prisma.complianceCase.count({
      where: {
        dealId: input.dealId,
        OR: [
          { status: "escalated" },
          {
            severity: "critical",
            status: { in: ["open", "under_review", "action_required"] },
          },
        ],
      },
    }),
  ]);

  const supervisorNotes = isAdmin
    ? reviews.map((r) => ({
        reviewId: r.id,
        notes: (r.notes ?? {}) as Record<string, unknown>,
      }))
    : undefined;

  return {
    enabled: true,
    visible: true,
    disclaimer: BROKER_DISCLAIMER,
    qaSummary: {
      reviews: reviews.map((r) => ({
        id: r.id,
        reviewType: r.reviewType,
        status: r.status,
        outcome: r.outcome,
        updatedAt: r.updatedAt.toISOString(),
      })),
    },
    complianceSummary: {
      openInternalCases: openCases,
      hasEscalatedOrCriticalAttention: escalatedAttention > 0,
    },
    supervisorNotes,
  };
}
