import { prisma } from "@/lib/db";
import type { WorkloadInsight } from "./workload.types";

export async function detectBottlenecksForBroker(brokerId: string): Promise<WorkloadInsight[]> {
  const out: WorkloadInsight[] = [];

  const overdueFollowUps = await prisma.lead.count({
    where: {
      introducedByBrokerId: brokerId,
      nextFollowUpAt: { lt: new Date() },
      pipelineStatus: { notIn: ["won", "lost"] },
    },
  });
  if (overdueFollowUps >= 5) {
    out.push({
      type: "overload",
      title: "Follow-up backlog",
      summary: `${overdueFollowUps} leads have overdue follow-up dates.`,
      priority: overdueFollowUps >= 15 ? "high" : "medium",
      reasons: ["Multiple CRM leads past next follow-up"],
      recommendedAction: "Triage oldest leads first or delegate follow-up within your team.",
    });
  }

  const pendingReview = await prisma.dealDocument.count({
    where: {
      workflowStatus: "broker_review",
      deal: { brokerId },
    },
  });
  if (pendingReview > 0) {
    out.push({
      type: "review",
      title: "Documents awaiting review",
      summary: `${pendingReview} deal document(s) need broker review.`,
      priority: pendingReview >= 5 ? "high" : "medium",
      reasons: ["Execution drafts pending broker decision"],
      recommendedAction: "Use the review queue or assign a reviewer on the deal.",
    });
  }

  const unassignedHot = await prisma.lead.findFirst({
    where: {
      introducedByBrokerId: brokerId,
      aiTier: "hot",
      lastFollowUpByBrokerId: null,
      pipelineStatus: "new",
      createdAt: { lt: new Date(Date.now() - 8 * 3600000) },
    },
    select: { id: true },
  });
  if (unassignedHot) {
    out.push({
      type: "unassigned",
      title: "High-priority lead may need ownership",
      summary: "A hot-tier lead has been new for several hours without follow-up assignment.",
      priority: "high",
      reasons: ["Hot tier + no follow-up broker + aging"],
      recommendedAction: "Claim follow-up or assign a coordinator.",
      leadId: unassignedHot.id,
    });
  }

  return out;
}
