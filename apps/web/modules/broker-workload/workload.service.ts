import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertDealAccessForBroker } from "@/modules/broker-collaboration/visibility.service";
import { detectBottlenecksForBroker } from "./bottleneck-detector.service";
import type { WorkloadInsight } from "./workload.types";

export async function getBrokerWorkloadSummary(actorId: string, _role: PlatformRole) {
  const [openTasks, pendingDocs, activeAssignments, dealsActive] = await Promise.all([
    prisma.lecipmBrokerTask.count({
      where: { brokerId: actorId, status: "open" },
    }),
    prisma.dealDocument.count({
      where: { workflowStatus: "broker_review", deal: { brokerId: actorId } },
    }),
    prisma.brokerDealAssignment.count({
      where: { assignedToUserId: actorId, status: "active" },
    }),
    prisma.deal.count({
      where: { brokerId: actorId, status: { notIn: ["closed", "cancelled"] } },
    }),
  ]);

  const bottlenecks = await detectBottlenecksForBroker(actorId);

  return {
    openTasks,
    pendingDocumentReviews: pendingDocs,
    activeAssignments: activeAssignments,
    activeDeals: dealsActive,
    bottlenecks,
  };
}

export async function getDealWorkload(dealId: string, actorId: string, role: PlatformRole) {
  const ok = await assertDealAccessForBroker(actorId, dealId, role);
  if (!ok) return null;
  const [assignments, requests] = await Promise.all([
    prisma.brokerDealAssignment.findMany({ where: { dealId } }),
    prisma.dealRequest.findMany({
      where: { dealId, status: { notIn: ["FULFILLED", "CANCELLED"] } },
      take: 50,
    }),
  ]);
  return { assignments, openRequests: requests };
}

export type { WorkloadInsight };
