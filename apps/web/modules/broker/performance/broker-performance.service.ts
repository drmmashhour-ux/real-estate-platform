/**
 * Deterministic broker performance summary — read-only; uses CRM + PlatformPayment signals.
 */

import { prisma } from "@/lib/db";
import { deriveLeadClosingStageFromRow } from "@/modules/broker/closing/broker-closing-state.service";
import type { LeadClosingStage } from "@/modules/broker/closing/broker-closing.types";
import { classifyBrokerPerformanceBand } from "./broker-performance-status.service";
import { buildBrokerPerformanceRecommendations } from "./broker-performance-recommendations.service";
import { recordPerformanceSummaryBuilt } from "./broker-performance-monitoring.service";
import type {
  BrokerPerformanceBand,
  BrokerPerformanceBreakdown,
  BrokerPerformanceSummary,
} from "./broker-performance.types";

const MS_HOUR = 60 * 60 * 1000;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function blendWithNeutral(score: number, sampleSize: number, minFull: number): number {
  if (sampleSize >= minFull) return Math.round(score);
  const c = sampleSize / minFull;
  return Math.round(score * c + 50 * (1 - c));
}

function hourScore(hours: number): number {
  if (hours <= 4) return 95;
  if (hours <= 12) return 82;
  if (hours <= 24) return 68;
  if (hours <= 72) return 52;
  return 38;
}

function isContactedPlus(stage: LeadClosingStage): boolean {
  return stage !== "new";
}

function isRespondedPlus(stage: LeadClosingStage): boolean {
  return (
    stage === "responded" ||
    stage === "meeting_scheduled" ||
    stage === "negotiation" ||
    stage === "closed_won" ||
    stage === "closed_lost"
  );
}

function isMeetingPlus(stage: LeadClosingStage): boolean {
  return stage === "meeting_scheduled" || stage === "negotiation" || stage === "closed_won";
}

export function computePerformanceBreakdownFromMetrics(input: {
  totalLeads: number;
  contactedOrBetter: number;
  respondedOrBetter: number;
  meetingOrBetter: number;
  closedWon: number;
  closedLost: number;
  unlockContactPairs: { hours: number }[];
  avgEngagementField: number | null;
  repliedCount: number;
  leadUnlockPaidCount: number;
}): { breakdown: BrokerPerformanceBreakdown; weakSignals: string[]; strongSignals: string[] } {
  const weak: string[] = [];
  const strong: string[] = [];

  const n = input.totalLeads;

  /** Contact rate: moved past untouched new */
  let contactRateScore = 50;
  if (n > 0) {
    contactRateScore = Math.round((100 * input.contactedOrBetter) / n);
  } else {
    weak.push("No assigned CRM leads — contact rate not measurable.");
  }
  contactRateScore = blendWithNeutral(contactRateScore, n, 8);

  /** Response speed from unlock → first contact */
  let responseSpeedScore = 50;
  if (input.unlockContactPairs.length >= 1) {
    const avgH =
      input.unlockContactPairs.reduce((a, x) => a + x.hours, 0) / input.unlockContactPairs.length;
    responseSpeedScore = hourScore(avgH);
    if (input.unlockContactPairs.length < 4) {
      weak.push("Small sample: few timed unlock→contact pairs — response speed is directional only.");
    } else {
      strong.push("Consistent unlock-to-contact timing observed in sample.");
    }
  } else {
    weak.push("No unlock-to-first-contact pairs — response speed defaulted neutral.");
  }
  responseSpeedScore = blendWithNeutral(responseSpeedScore, input.unlockContactPairs.length, 5);

  /** Engagement */
  let engagementScore = 50;
  if (n > 0) {
    const replyRate = (100 * input.repliedCount) / n;
    const stageRate = (100 * input.respondedOrBetter) / n;
    const eng = input.avgEngagementField != null ? clamp(input.avgEngagementField, 0, 100) : 50;
    engagementScore = Math.round((replyRate * 0.35 + stageRate * 0.35 + eng * 0.3));
  } else {
    weak.push("Engagement not measurable without leads.");
  }
  engagementScore = blendWithNeutral(engagementScore, n, 8);

  /** Close signals */
  let closeSignalScore = 50;
  const decided = input.closedWon + input.closedLost;
  if (decided >= 3) {
    closeSignalScore = Math.round((100 * input.closedWon) / decided);
    strong.push("Enough win/loss outcomes to estimate close rate in-sample.");
  } else if (decided > 0) {
    closeSignalScore = Math.round(55 + (45 * input.closedWon) / decided);
    weak.push("Few closed deals — close signal blended toward neutral.");
  } else {
    if (n > 0) {
      closeSignalScore = Math.round((70 * input.meetingOrBetter) / n + 15);
    }
    weak.push("No closed won/lost rows — using pipeline depth only.");
  }
  closeSignalScore = blendWithNeutral(closeSignalScore, Math.max(decided, n > 0 ? 1 : 0), 5);

  /** Retention / repeat monetization */
  let retentionScore = 48;
  if (input.leadUnlockPaidCount >= 6) {
    retentionScore = 92;
    strong.push("Repeated paid lead unlocks — consistent marketplace participation.");
  } else if (input.leadUnlockPaidCount >= 3) {
    retentionScore = 76;
  } else if (input.leadUnlockPaidCount >= 1) {
    retentionScore = 60;
  } else {
    weak.push("No paid lead-unlock rows — retention signal neutral.");
  }

  const breakdown: BrokerPerformanceBreakdown = {
    responseSpeedScore: clamp(responseSpeedScore, 0, 100),
    contactRateScore: clamp(contactRateScore, 0, 100),
    engagementScore: clamp(engagementScore, 0, 100),
    closeSignalScore: clamp(closeSignalScore, 0, 100),
    retentionScore: clamp(retentionScore, 0, 100),
  };

  return { breakdown, weakSignals: weak, strongSignals: strong };
}

function overallFromBreakdown(b: BrokerPerformanceBreakdown): number {
  const v =
    b.responseSpeedScore * 0.22 +
    b.contactRateScore * 0.22 +
    b.engagementScore * 0.2 +
    b.closeSignalScore * 0.2 +
    b.retentionScore * 0.16;
  return Math.round(clamp(v, 0, 100));
}

export async function buildBrokerPerformanceSummary(brokerId: string): Promise<BrokerPerformanceSummary | null> {
  const user = await prisma.user.findUnique({ where: { id: brokerId }, select: { role: true } });
  if (!user || user.role !== "BROKER") return null;

  const leads = await prisma.lead.findMany({
    where: {
      OR: [{ introducedByBrokerId: brokerId }, { lastFollowUpByBrokerId: brokerId }],
    },
    select: {
      aiExplanation: true,
      pipelineStage: true,
      pipelineStatus: true,
      wonAt: true,
      lostAt: true,
      contactUnlockedAt: true,
      firstContactAt: true,
      lastContactedAt: true,
      dmStatus: true,
      engagementScore: true,
    },
    take: 500,
  });

  const leadUnlockPaidCount = await prisma.platformPayment.count({
    where: {
      userId: brokerId,
      paymentType: "lead_unlock",
      status: "paid",
    },
  });

  let contactedOrBetter = 0;
  let respondedOrBetter = 0;
  let meetingOrBetter = 0;
  let closedWon = 0;
  let closedLost = 0;
  let repliedCount = 0;
  let engSum = 0;
  let engN = 0;
  const unlockContactPairs: { hours: number }[] = [];

  for (const lead of leads) {
    const stage = deriveLeadClosingStageFromRow(lead);
    if (isContactedPlus(stage)) contactedOrBetter += 1;
    if (isRespondedPlus(stage)) respondedOrBetter += 1;
    if (isMeetingPlus(stage)) meetingOrBetter += 1;
    if (stage === "closed_won") closedWon += 1;
    if (stage === "closed_lost") closedLost += 1;
    if (lead.dmStatus === "replied") repliedCount += 1;
    if (typeof lead.engagementScore === "number") {
      engSum += lead.engagementScore;
      engN += 1;
    }
    if (lead.contactUnlockedAt && lead.firstContactAt) {
      const h = (lead.firstContactAt.getTime() - lead.contactUnlockedAt.getTime()) / MS_HOUR;
      if (h >= 0 && h < 24 * 120) unlockContactPairs.push({ hours: h });
    }
  }

  const avgEngagementField = engN > 0 ? engSum / engN : null;

  const { breakdown, weakSignals, strongSignals } = computePerformanceBreakdownFromMetrics({
    totalLeads: leads.length,
    contactedOrBetter,
    respondedOrBetter,
    meetingOrBetter,
    closedWon,
    closedLost,
    unlockContactPairs,
    avgEngagementField,
    repliedCount,
    leadUnlockPaidCount,
  });

  const overallScore = overallFromBreakdown(breakdown);
  const band: BrokerPerformanceBand = classifyBrokerPerformanceBand(overallScore, {
    weak: weakSignals,
    strong: strongSignals,
  });

  const base: BrokerPerformanceSummary = {
    brokerId,
    overallScore,
    band,
    breakdown,
    strongSignals,
    weakSignals,
    recommendations: [],
    createdAt: new Date().toISOString(),
  };
  base.recommendations = buildBrokerPerformanceRecommendations(base);

  recordPerformanceSummaryBuilt({
    band,
    weakCount: weakSignals.length,
    recCount: base.recommendations.length,
    missingData: weakSignals.some((w) => w.includes("No ") || w.includes("neutral") || w.includes("not ")),
  });

  return base;
}
