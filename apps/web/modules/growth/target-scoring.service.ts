import { prisma } from "@/lib/db";
import { isPriorityRegion, getCityConfig } from "./geo-target.config";
import type { BrokerTargetScoreInput, ExperienceLevel, ActivityLevel, TechAdoption } from "./broker-targeting.types";

export interface ScoringInput {
  city?: string | null;
  hasActiveSocials?: boolean;
  hasAgency?: boolean;
  isIndependent?: boolean;
  source?: string;
}

export interface ScoreBrokerTargetResult {
  targetScore: number;
  /** 0–100, same as targetScore; explicit for API consumers. */
  breakdown?: { fit: number; reachability: number; adoption: number };
}

/**
 * Core 0–100 score: fit vs ICP, reachability (social / source), adoption & tech signals.
 * Heuristic only — operators still choose who to contact (manual-first).
 */
export function scoreBrokerTarget(profile: BrokerTargetScoreInput): ScoreBrokerTargetResult {
  let fit = 0;
  let reach = 0;
  let adopt = 0;

  // Market & Priority Flag
  const cityConfig = profile.market ? getCityConfig(profile.market) : null;
  if (cityConfig?.isPrimaryMarket) {
    fit += 35; // Major boost for primary market domination
  } else if (profile.market && isPriorityRegion(profile.market)) {
    reach += 18;
  } else if (profile.market) {
    reach += 6;
  }

  // Specialization fit (condo / rental / investor align with early product)
  const s = profile.specialization.toLowerCase();
  if (s.includes("condo") || s.includes("rental") || s.includes("invest")) fit += 12;
  else if (s.includes("luxury")) fit += 8;
  else fit += 4;

  // Tech adoption
  const tech: TechAdoption = profile.techAdoption;
  if (tech === "high") adopt += 18;
  else if (tech === "medium") adopt += 10;
  else adopt += 4;

  // Social proof of reachability
  if (profile.hasActiveSocials) reach += 14;
  if (profile.source === "REFERRAL") reach += 12;
  else if (profile.source === "INSTAGRAM" || profile.source === "LINKEDIN" || profile.source === "GOOGLE_MAPS")
    reach += 6;

  // Responsiveness (manual)
  if (profile.responsiveness === "fast") adopt += 12;
  else if (profile.responsiveness === "normal") adopt += 6;

  if (profile.leadPrioritizationPain) fit += 14;

  const raw = fit + reach + adopt;
  const targetScore = Math.max(0, Math.min(100, Math.round(raw * 0.35)));

  return {
    targetScore,
    breakdown: {
      fit: Math.min(100, fit),
      reachability: Math.min(100, reach),
      adoption: Math.min(100, adopt),
    },
  };
}

/**
 * Map legacy `computeBrokerScore` inputs to the full profile model.
 */
export function scoringInputToTargetProfile(input: ScoringInput): BrokerTargetScoreInput {
  return {
    experienceLevel: "mid",
    activityLevel: input.hasActiveSocials ? "high" : "medium",
    market: input.city || "",
    specialization: "condo",
    techAdoption: input.hasActiveSocials ? "high" : "medium",
    hasActiveSocials: !!input.hasActiveSocials,
    responsiveness: "unknown",
    source: input.source || "DIRECT",
    leadPrioritizationPain: false,
  };
}

export function computeBrokerScore(input: ScoringInput): number {
  return scoreBrokerTarget(scoringInputToTargetProfile(input)).targetScore;
}

/** Infer `BrokerTargetScoreInput` from a stored outreach row + free-text fields (manual-first). */
export function outreachRowToTargetProfile(lead: {
  city: string | null;
  source: string;
  instagramHandle: string | null;
  linkedinUrl: string | null;
  agency: string | null;
  specialization: string | null;
  notes: string | null;
}): BrokerTargetScoreInput {
  const hasSocial = !!(lead.instagramHandle?.trim() || lead.linkedinUrl?.trim());
  const notes = `${lead.notes || ""} ${lead.specialization || ""}`.toLowerCase();
  const leadPain =
    /priorit|queue|inbox|which lead|overwhelm|too many|follow.?up/i.test(notes) ||
    /priorit|queue|inbox|which deal/i.test(lead.notes || "");

  let experienceLevel: ExperienceLevel = "mid";
  if (/\b(new|rookie|junior|1\s*st year|first year)\b/i.test(notes)) experienceLevel = "junior";
  if (/\b(20\+|vétéran|veteran|groupe|team lead|owner|director)\b/i.test(notes)) experienceLevel = "senior";

  let activityLevel: ActivityLevel = hasSocial ? "high" : "low";
  if (hasSocial && (lead.source === "DIRECT" || !lead.source)) activityLevel = "medium";

  let techAdoption: TechAdoption = hasSocial ? "high" : "medium";
  if (/whatsapp|not good with|prefers call|hates tech/i.test(notes)) techAdoption = "low";
  if (/crm|hubspot|notion|sheet|airtable|ai\b/i.test(notes)) techAdoption = "high";

  return {
    experienceLevel,
    activityLevel,
    market: lead.city || "",
    specialization: (lead.specialization || "condo").toLowerCase(),
    techAdoption,
    hasActiveSocials: hasSocial,
    responsiveness: "unknown",
    source: lead.source,
    leadPrioritizationPain: leadPain,
  };
}

export function scoreOutreachLeadRow(lead: Parameters<typeof outreachRowToTargetProfile>[0]): number {
  return scoreBrokerTarget(outreachRowToTargetProfile(lead)).targetScore;
}

/**
 * High-score NEW leads — used by the outreach hub sidebar.
 * For a combined “build list + top 5 today”, use {@link getDailyTargets} in `target-builder.service`.
 */
export async function getTopTargets(limit = 5) {
  return prisma.outreachLead.findMany({
    where: {
      status: "NEW",
      score: { gte: 0 },
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function refreshLeadScore(leadId: string) {
  const lead = await prisma.outreachLead.findUnique({ where: { id: leadId } });
  if (!lead) return;
  const score = scoreOutreachLeadRow(lead);
  await prisma.outreachLead.update({ where: { id: leadId }, data: { score } });
  return score;
}
