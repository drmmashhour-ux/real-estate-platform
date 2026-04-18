/**
 * Aggregated broker closing funnel counts — read-only; derived from CRM leads.
 */

import { prisma } from "@/lib/db";
import { deriveLeadClosingStageFromRow } from "./broker-closing-state.service";
import type { LeadClosingStage } from "./broker-closing.types";

export type BrokerDealSummary = {
  brokerId: string;
  totalLeads: number;
  newLeads: number;
  contacted: number;
  responded: number;
  meetings: number;
  negotiation: number;
  closedWon: number;
  closedLost: number;
  /** closed_won / max(1, totalLeads - closed_lost) — advisory */
  winRateApprox: number;
  /** (contacted + responded + meetings + negotiation + closed) / max(1, total) — rough activation */
  activeProgressRate: number;
};

function bucket(stage: LeadClosingStage): keyof Omit<BrokerDealSummary, "brokerId" | "winRateApprox" | "activeProgressRate"> | null {
  switch (stage) {
    case "new":
      return "newLeads";
    case "contacted":
      return "contacted";
    case "responded":
      return "responded";
    case "meeting_scheduled":
      return "meetings";
    case "negotiation":
      return "negotiation";
    case "closed_won":
      return "closedWon";
    case "closed_lost":
      return "closedLost";
    default:
      return null;
  }
}

export async function buildBrokerDealSummary(brokerId: string): Promise<BrokerDealSummary | null> {
  const user = await prisma.user.findUnique({ where: { id: brokerId }, select: { role: true } });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) return null;

  const leads = await prisma.lead.findMany({
    where: {
      OR: [
        { introducedByBrokerId: brokerId },
        { lastFollowUpByBrokerId: brokerId },
        { leadSource: { in: ["evaluation_lead", "broker_consultation"] } },
      ],
    },
    select: {
      aiExplanation: true,
      pipelineStage: true,
      pipelineStatus: true,
      wonAt: true,
      lostAt: true,
    },
    take: 500,
  });

  const counts = {
    newLeads: 0,
    contacted: 0,
    responded: 0,
    meetings: 0,
    negotiation: 0,
    closedWon: 0,
    closedLost: 0,
  };

  for (const lead of leads) {
    const stage = deriveLeadClosingStageFromRow(lead);
    const k = bucket(stage);
    if (k) counts[k] += 1;
  }

  const totalLeads = leads.length;
  const denom = Math.max(1, totalLeads - counts.closedLost);
  const winRateApprox = Math.round((counts.closedWon / denom) * 1000) / 1000;
  const progressed =
    counts.contacted + counts.responded + counts.meetings + counts.negotiation + counts.closedWon + counts.closedLost;
  const activeProgressRate = Math.round((progressed / Math.max(1, totalLeads)) * 1000) / 1000;

  return {
    brokerId,
    totalLeads,
    ...counts,
    winRateApprox,
    activeProgressRate,
  };
}
