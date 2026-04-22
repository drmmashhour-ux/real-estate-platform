/**
 * Feature extraction for senior lead scoring — engagement from matching events + fit from listing/lead data.
 * Optional `hints` (from client or admin) fill gaps the server cannot see (voice, device, UTM).
 */
import { prisma } from "@/lib/db";

const CARE_ORDER = ["AUTONOMOUS", "SEMI_AUTONOMOUS", "ASSISTED", "FULL_CARE"] as const;

function careRank(level: string): number {
  const i = CARE_ORDER.indexOf(level as (typeof CARE_ORDER)[number]);
  return i >= 0 ? i : 0;
}

/** Map needs urgency to minimum acceptable care tier rank. */
function needsToMinCareRank(needs: string | null | undefined): number {
  const u = needs?.toUpperCase() ?? "";
  if (u.includes("HIGH")) return careRank("FULL_CARE");
  if (u.includes("MEDIUM")) return careRank("ASSISTED");
  if (u.includes("LOW")) return careRank("SEMI_AUTONOMOUS");
  return careRank("AUTONOMOUS");
}

export type LeadFeatureHints = {
  /** User used voice search / read-aloud before submitting */
  voiceUsed?: boolean;
  /** User navigated from top match card with high score */
  clickedBestMatch?: boolean;
  /** Minutes on site when tracked client-side */
  timeOnPlatformMinutes?: number;
  deviceType?: string;
  /** utm_source or referrer tag */
  source?: string;
};

export type ExtractedLeadFeatures = {
  timeOnPlatform: number;
  pagesViewed: number;
  interactions: number;
  budgetMatch: number;
  careMatch: number;
  voiceUsed: boolean;
  clickedBestMatch: boolean;
  deviceType: string | null;
  source: string | null;
  engagementScore: number;
  intentSignalsScore: number;
  sourceQualityScore: number;
};

/** Budget fit 0–100 from lead budget vs residence published range. */
export function computeBudgetMatch(leadBudget: number | null | undefined, residence: {
  basePrice: number | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
}): number {
  if (leadBudget == null || !Number.isFinite(leadBudget)) return 55;
  const min = residence.priceRangeMin ?? residence.basePrice;
  const max = residence.priceRangeMax ?? residence.basePrice;
  if (min != null && max != null && leadBudget >= min && leadBudget <= max) return 95;
  if (residence.basePrice != null && leadBudget >= residence.basePrice * 0.85) return 72;
  if (min != null && leadBudget < min) return 38;
  return 62;
}

/** Care tier fit 0–100 from residence care level vs stated needs. */
export function computeCareMatch(
  residenceCareLevel: string,
  needsLevel: string | null | undefined
): number {
  const resRank = careRank(residenceCareLevel);
  const needRank = needsToMinCareRank(needsLevel);
  if (resRank >= needRank) return 88;
  if (resRank + 1 >= needRank) return 62;
  return 40;
}

function engagementFromSignals(args: {
  pagesViewed: number;
  interactions: number;
  timeOnPlatformMinutes: number;
  voiceUsed: boolean;
  clickedBestMatch: boolean;
}): number {
  let e = 35;
  e += Math.min(30, args.pagesViewed * 6);
  e += Math.min(20, args.interactions * 4);
  e += Math.min(10, args.timeOnPlatformMinutes * 0.8);
  if (args.voiceUsed) e += 8;
  if (args.clickedBestMatch) e += 10;
  return Math.max(0, Math.min(100, Math.round(e)));
}

function intentFromSignals(args: {
  interactions: number;
  voiceUsed: boolean;
  clickedBestMatch: boolean;
  pagesViewed: number;
}): number {
  let i = 30;
  i += Math.min(35, args.interactions * 5);
  if (args.voiceUsed) i += 15;
  if (args.clickedBestMatch) i += 12;
  i += Math.min(18, args.pagesViewed * 3);
  return Math.max(0, Math.min(100, Math.round(i)));
}

/** Source quality prior 0–100 (boost referrals / organic). */
export function sourceQualityScore(source: string | null | undefined): number {
  const s = source?.toLowerCase().trim() ?? "";
  if (!s) return 58;
  if (s.includes("referral") || s.includes("friend")) return 88;
  if (s.includes("organic") || s.includes("direct")) return 72;
  if (s.includes("google") || s.includes("seo")) return 68;
  if (s.includes("paid") || s.includes("ads")) return 52;
  return 62;
}

/**
 * Build features for a senior lead using DB signals + optional hints (voice, device, utm).
 */
export async function extractSeniorLeadFeatures(
  leadId: string,
  hints?: LeadFeatureHints | null
): Promise<ExtractedLeadFeatures> {
  const lead = await prisma.seniorLead.findUnique({
    where: { id: leadId },
    include: {
      residence: {
        select: {
          careLevel: true,
          basePrice: true,
          priceRangeMin: true,
          priceRangeMax: true,
        },
      },
    },
  });
  if (!lead) {
    throw new Error("Lead not found");
  }

  const cutoff = lead.createdAt;
  const userId = lead.familyUserId;

  const events =
    userId ?
      await prisma.matchingEvent.findMany({
        where: {
          userId,
          createdAt: { lte: cutoff },
        },
        select: { eventType: true, residenceId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const residenceIds = new Set<string>();
  let interactions = 0;
  for (const ev of events) {
    if (ev.eventType === "VIEW" || ev.eventType === "CLICK") {
      residenceIds.add(ev.residenceId);
    }
    if (ev.eventType === "CLICK" || ev.eventType === "LEAD") interactions += 1;
  }

  const pagesViewed = residenceIds.size;
  let timeOnPlatform = 0;
  if (events.length >= 2) {
    const first = events[0]!.createdAt.getTime();
    const last = events[events.length - 1]!.createdAt.getTime();
    timeOnPlatform = Math.max(0, (last - first) / 60000);
  }
  if (hints?.timeOnPlatformMinutes != null && Number.isFinite(hints.timeOnPlatformMinutes)) {
    timeOnPlatform = Math.max(timeOnPlatform, hints.timeOnPlatformMinutes);
  }

  const voiceUsed = hints?.voiceUsed === true;
  const clickedBestMatch = hints?.clickedBestMatch === true;
  const deviceType = hints?.deviceType?.slice(0, 32) ?? null;
  const source = hints?.source?.slice(0, 160) ?? null;

  const budgetMatch = computeBudgetMatch(lead.budget, lead.residence);
  const careMatch = computeCareMatch(lead.residence.careLevel, lead.needsLevel);

  const engagementScore = engagementFromSignals({
    pagesViewed,
    interactions,
    timeOnPlatformMinutes: timeOnPlatform,
    voiceUsed,
    clickedBestMatch,
  });

  const intentSignalsScore = intentFromSignals({
    interactions,
    voiceUsed,
    clickedBestMatch,
    pagesViewed,
  });

  const sourceQuality = sourceQualityScore(source);

  return {
    timeOnPlatform,
    pagesViewed,
    interactions,
    budgetMatch,
    careMatch,
    voiceUsed,
    clickedBestMatch,
    deviceType,
    source,
    engagementScore,
    intentSignalsScore,
    sourceQualityScore: sourceQuality,
  };
}
