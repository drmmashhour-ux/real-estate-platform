/**
 * Senior lead scoring — weighted linear model + bands + persistence.
 * Visit / contract probabilities are proxied by score/100 (calibrate with outcomes over time).
 *
 * Learning loop: slight weight nudges when leads close as converted (CLOSED).
 */
import { prisma } from "@/lib/db";
import {
  extractSeniorLeadFeatures,
  type LeadFeatureHints,
  type ExtractedLeadFeatures,
} from "./lead-features.service";

export type LeadBand = "HIGH" | "MEDIUM" | "LOW";

const DEFAULT_WEIGHTS = {
  wEngagement: 0.25,
  wBudget: 0.25,
  wCare: 0.25,
  wIntent: 0.15,
  wSource: 0.1,
} as const;

export function bandFromScore(score: number): LeadBand {
  if (score > 75) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

export function buildExplanation(f: ExtractedLeadFeatures): string[] {
  const lines: string[] = [];
  if (f.engagementScore >= 72) lines.push("Strong engagement before requesting contact");
  else if (f.engagementScore >= 45) lines.push("Moderate browsing activity");
  else lines.push("Limited browsing signals — confirm interest on first call");

  if (f.budgetMatch >= 85) lines.push("Budget aligns with posted pricing");
  else if (f.budgetMatch < 45) lines.push("Budget may be below typical published range");

  if (f.careMatch >= 80) lines.push("Care level fits stated needs");
  else lines.push("Confirm care fit on intake");

  if (f.pagesViewed >= 3) lines.push("Viewed multiple residences");
  else if (f.pagesViewed >= 1) lines.push("Looked at at least one listing in depth");

  if (f.voiceUsed) lines.push("Used accessibility / voice tools");
  if (f.clickedBestMatch) lines.push("Opened a top match from results");

  return [...new Set(lines)].slice(0, 6);
}

export async function getOrCreateScoringWeights() {
  const row = await prisma.leadScoringWeights.findFirst({ orderBy: { updatedAt: "desc" } });
  if (row) return row;
  return prisma.leadScoringWeights.create({
    data: { ...DEFAULT_WEIGHTS },
  });
}

function normalizeWeights(w: {
  wEngagement: number;
  wBudget: number;
  wCare: number;
  wIntent: number;
  wSource: number;
}) {
  const s = w.wEngagement + w.wBudget + w.wCare + w.wIntent + w.wSource;
  if (s < 1e-9) return { ...DEFAULT_WEIGHTS };
  return {
    wEngagement: w.wEngagement / s,
    wBudget: w.wBudget / s,
    wCare: w.wCare / s,
    wIntent: w.wIntent / s,
    wSource: w.wSource / s,
  };
}

function clampWeightDelta(v: number, baseline: number, maxDelta = 0.05): number {
  const lo = baseline - maxDelta;
  const hi = baseline + maxDelta;
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Positive outcome (contract closed): slightly increase engagement + intent weights.
 */
export async function applyPositiveConversionLearning(): Promise<void> {
  const w = await getOrCreateScoringWeights();
  const step = 0.008;
  let wEngagement = clampWeightDelta(w.wEngagement + step, DEFAULT_WEIGHTS.wEngagement);
  let wIntent = clampWeightDelta(w.wIntent + step, DEFAULT_WEIGHTS.wIntent);
  let wBudget = w.wBudget;
  let wCare = w.wCare;
  let wSource = w.wSource;
  const norm = normalizeWeights({ wEngagement, wBudget, wCare, wIntent, wSource });
  await prisma.leadScoringWeights.update({
    where: { id: w.id },
    data: {
      wEngagement: norm.wEngagement,
      wBudget: norm.wBudget,
      wCare: norm.wCare,
      wIntent: norm.wIntent,
      wSource: norm.wSource,
    },
  });
}

/** Stalled / lost lead — tiny shift toward budget+care fit (signals that failed to convert). */
export async function applyNegativeOutcomeLearning(): Promise<void> {
  const w = await getOrCreateScoringWeights();
  const step = 0.006;
  let wBudget = clampWeightDelta(w.wBudget + step, DEFAULT_WEIGHTS.wBudget);
  let wCare = clampWeightDelta(w.wCare + step, DEFAULT_WEIGHTS.wCare);
  let wEngagement = clampWeightDelta(w.wEngagement - step * 0.5, DEFAULT_WEIGHTS.wEngagement);
  const norm = normalizeWeights({
    wEngagement,
    wBudget,
    wCare,
    wIntent: w.wIntent,
    wSource: w.wSource,
  });
  await prisma.leadScoringWeights.update({
    where: { id: w.id },
    data: {
      wEngagement: norm.wEngagement,
      wBudget: norm.wBudget,
      wCare: norm.wCare,
      wIntent: norm.wIntent,
      wSource: norm.wSource,
    },
  });
}

export function computeLeadScoreNumber(
  f: ExtractedLeadFeatures,
  weights: {
    wEngagement: number;
    wBudget: number;
    wCare: number;
    wIntent: number;
    wSource: number;
  }
): number {
  const raw =
    weights.wEngagement * f.engagementScore +
    weights.wBudget * f.budgetMatch +
    weights.wCare * f.careMatch +
    weights.wIntent * f.intentSignalsScore +
    weights.wSource * f.sourceQualityScore;
  return Math.round(Math.max(0, Math.min(100, raw)) * 10) / 10;
}

export type LeadScoreResult = {
  score: number;
  probability: number;
  band: LeadBand;
  explanation: string[];
  features: ExtractedLeadFeatures;
};

export async function scoreSeniorLead(
  leadId: string,
  hints?: LeadFeatureHints | null
): Promise<LeadScoreResult> {
  const features = await extractSeniorLeadFeatures(leadId, hints);
  const wRow = await getOrCreateScoringWeights();
  const weights = normalizeWeights(wRow);
  const score = computeLeadScoreNumber(features, weights);
  const probability = Math.round((score / 100) * 1000) / 1000;
  const band = bandFromScore(score);
  const explanation = buildExplanation(features);

  await prisma.leadFeatureSnapshot.create({
    data: {
      leadId,
      timeOnPlatform: features.timeOnPlatform,
      pagesViewed: features.pagesViewed,
      interactions: features.interactions,
      budgetMatch: features.budgetMatch,
      careMatch: features.careMatch,
      deviceType: features.deviceType,
      source: features.source,
      metadata: {
        voiceUsed: features.voiceUsed,
        clickedBestMatch: features.clickedBestMatch,
        engagementScore: features.engagementScore,
        intentSignalsScore: features.intentSignalsScore,
        sourceQualityScore: features.sourceQualityScore,
      },
    },
  });

  await prisma.leadScore.create({
    data: {
      leadId,
      score,
      probability,
      band,
      explanationJson: explanation,
    },
  });

  return { score, probability, band, explanation, features };
}

export async function getLatestLeadScore(leadId: string) {
  return prisma.leadScore.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLatestScoresForLeads(leadIds: string[]): Promise<Map<string, Awaited<ReturnType<typeof getLatestLeadScore>>>> {
  const map = new Map<string, Awaited<ReturnType<typeof getLatestLeadScore>>>();
  if (leadIds.length === 0) return map;
  const rows = await prisma.leadScore.findMany({
    where: { leadId: { in: leadIds } },
    orderBy: { createdAt: "desc" },
  });
  for (const r of rows) {
    if (!map.has(r.leadId)) map.set(r.leadId, r);
  }
  return map;
}

const BAND_ORDER: Record<LeadBand, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function compareLeadsByPriority(a: { band: LeadBand; score: number }, b: { band: LeadBand; score: number }): number {
  const d = BAND_ORDER[a.band] - BAND_ORDER[b.band];
  if (d !== 0) return d;
  return b.score - a.score;
}
