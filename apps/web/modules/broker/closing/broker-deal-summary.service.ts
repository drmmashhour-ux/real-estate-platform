/**
 * Aggregated broker closing funnel counts — read-only; derived from CRM leads.
 */

import { prisma } from "@/lib/db";
import { deriveLeadClosingStageFromRow } from "./broker-closing-state.service";
import type { LeadClosingStage } from "./broker-closing.types";

export type BrokerDealSummaryInsights = {
  /** Stage with the highest count among active (non-terminal) leads — advisory */
  largestActiveStage: LeadClosingStage | null;
  largestActiveStageCount: number;
  concentrationAdvisory: string;
  /** Heuristic note on follow-up backlog — not verified automatically */
  followUpDebtAdvisory: string;
  /** Where conversations may be stalling (often contacted-heavy) — advisory */
  stuckPatternAdvisory: string;
  /** Static heuristic when contacted pool dominates deeper stages — not a time-series trend */
  followUpDebtTrendNote: string;
};

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
  /** Pipeline friction hints — wording only; not predictions */
  insights?: BrokerDealSummaryInsights;
};

const ACTIVE_STAGES: LeadClosingStage[] = ["new", "contacted", "responded", "meeting_scheduled", "negotiation"];

function stageDisplayLabel(stage: LeadClosingStage): string {
  const labels: Record<LeadClosingStage, string> = {
    new: "New",
    contacted: "Contacted",
    responded: "Responded / qualified",
    meeting_scheduled: "Meeting scheduled",
    negotiation: "Negotiation",
    closed_won: "Won",
    closed_lost: "Lost",
  };
  return labels[stage] ?? stage;
}

function bucket(stage: LeadClosingStage): keyof Omit<BrokerDealSummary, "brokerId" | "winRateApprox" | "activeProgressRate" | "insights"> | null {
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

  const histActive: Partial<Record<LeadClosingStage, number>> = {};

  for (const lead of leads) {
    const stage = deriveLeadClosingStageFromRow(lead);
    const k = bucket(stage);
    if (k) counts[k] += 1;
    if (ACTIVE_STAGES.includes(stage)) {
      histActive[stage] = (histActive[stage] ?? 0) + 1;
    }
  }

  let largestActiveStage: LeadClosingStage | null = null;
  let largestActiveStageCount = 0;
  for (const st of ACTIVE_STAGES) {
    const c = histActive[st] ?? 0;
    if (c > largestActiveStageCount) {
      largestActiveStageCount = c;
      largestActiveStage = st;
    }
  }

  const concentrated =
    largestActiveStage != null && largestActiveStageCount > 0
      ? `Most active pipeline leads are in “${stageDisplayLabel(largestActiveStage)}” (${largestActiveStageCount}). That concentration can mean this stage needs extra focus — not a guarantee of outcomes.`
      : "Pipeline counts are evenly spread across stages — keep your usual rhythm.";

  const deeper =
    counts.responded + counts.meetings + counts.negotiation;
  const followUpDebtAdvisory =
    counts.contacted >= 3 && counts.contacted > deeper
      ? `You have more leads marked contacted (${counts.contacted}) than deeper-stage leads (${deeper}). Consider tightening follow-ups and advancing stages — the platform does not verify outbound sends.`
      : "Follow-up backlog looks balanced versus deeper stages — advisory only.";

  const activeTotal = ACTIVE_STAGES.reduce((acc, st) => acc + (histActive[st] ?? 0), 0);
  const contactedShare =
    activeTotal > 0 ? ((histActive["contacted"] ?? 0) / activeTotal) : 0;

  const stuckPatternAdvisory =
    largestActiveStage === "contacted" && largestActiveStageCount >= 3 && contactedShare >= 0.35
      ? `Many active leads sit in “Contacted” (${largestActiveStageCount}) — often a signal to shorten follow-up loops or confirm reply signals before advancing. Directional only.`
      : largestActiveStage === "responded" && largestActiveStageCount >= 3
        ? `A cluster in “Responded” (${largestActiveStageCount}) may mean meetings or next steps need clearer scheduling — advisory.`
        : "No extreme stage clustering detected in this snapshot — keep logging touches so signals stay trustworthy.";

  const followUpDebtTrendNote =
    counts.contacted >= 4 && counts.contacted >= deeper * 2
      ? `Follow-up debt may be elevated: contacted (${counts.contacted}) outweighs deeper stages (${deeper}). This is a same-moment heuristic — not a verified trend line.`
      : "Relative contacted vs deeper-stage balance looks moderate in this snapshot.";

  const insights: BrokerDealSummaryInsights = {
    largestActiveStage,
    largestActiveStageCount,
    concentrationAdvisory: concentrated,
    followUpDebtAdvisory,
    stuckPatternAdvisory,
    followUpDebtTrendNote,
  };

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
    insights,
  };
}
