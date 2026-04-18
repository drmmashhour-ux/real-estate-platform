/**
 * Deterministic lead quality scoring — read-only; advisory suggested price via `computeLeadSuggestedPrice`.
 */

import { extractEvaluationSnapshot } from "@/lib/leads/timeline-helpers";
import { inferLeadIntentLabel } from "@/modules/leads/lead-monetization.service";
import { computeLeadSuggestedPrice } from "@/modules/leads/lead-pricing.service";
import { recordLeadQualitySummaryBuilt } from "@/modules/leads/lead-quality-monitoring.service";
import type { LeadQualityBand, LeadQualityBreakdown, LeadQualitySummary } from "@/modules/leads/lead-quality.types";

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

export function classifyLeadQualityBand(score: number): LeadQualityBand {
  const s = clamp(score, 0, 100);
  if (s >= 88) return "premium";
  if (s >= 72) return "high";
  if (s >= 45) return "medium";
  return "low";
}

const URGENCY_RE = /\b(urgent|asap|vite|imm[ée]diat|quick close|this week|soon)\b/i;

function completenessScore(lead: { name: string; email: string; phone: string; message: string }): number {
  let c = 0;
  if (lead.name.trim().length >= 2) c += 20;
  if (lead.email.includes("@")) c += 20;
  if (lead.phone.replace(/\D/g, "").length >= 10) c += 20;
  const ml = lead.message.trim().length;
  if (ml >= 160) c += 40;
  else if (ml >= 60) c += 32;
  else if (ml >= 20) c += 22;
  else c += 10;
  return clamp(c, 0, 100);
}

function intentClarityScore(lead: { leadType: string | null; message: string | null }): number {
  const label = inferLeadIntentLabel(lead);
  if (label === "invest") return 92;
  if (label === "buy") return 78;
  if (label === "rent") return 72;
  return 48;
}

function budgetSignalScore(lead: {
  message: string;
  aiExplanation: unknown;
  dealValue: number | null;
}): number {
  const snap = extractEvaluationSnapshot(lead.aiExplanation);
  const est = lead.dealValue ?? snap?.estimate ?? null;
  if (est != null && est > 0) {
    if (est >= 750_000) return 95;
    if (est >= 400_000) return 85;
    if (est >= 200_000) return 72;
    return 62;
  }
  if (snap?.minValue != null && snap?.maxValue != null) return 68;
  if (/\$\s*[0-9]/.test(lead.message) || /\b[0-9]{3}\s*000\b/.test(lead.message)) return 58;
  return 42;
}

function urgencyScore(lead: { message: string; highIntent: boolean; score: number }): number {
  let u = 40;
  if (URGENCY_RE.test(lead.message)) u += 35;
  if (lead.highIntent) u += 18;
  if (lead.score >= 75) u += 12;
  return clamp(u, 0, 100);
}

function engagementSignalScore(lead: { score: number; engagementScore: number }): number {
  const e = typeof lead.engagementScore === "number" ? lead.engagementScore : 0;
  const blended = e * 0.55 + lead.score * 0.45;
  return clamp(Math.round(blended), 0, 100);
}

export type LeadQualityInput = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  score: number;
  engagementScore: number;
  leadSource: string | null;
  leadType: string | null;
  aiExplanation: unknown;
  purchaseRegion: string | null;
  highIntent: boolean;
  dealValue: number | null;
};

export function buildLeadQualitySummary(
  lead: LeadQualityInput,
  opts?: { recordMonitoring?: boolean },
): LeadQualitySummary {
  const breakdown: LeadQualityBreakdown = {
    completenessScore: completenessScore(lead),
    intentScore: intentClarityScore({ leadType: lead.leadType, message: lead.message }),
    budgetScore: budgetSignalScore({
      message: lead.message,
      aiExplanation: lead.aiExplanation,
      dealValue: lead.dealValue,
    }),
    urgencyScore: urgencyScore({
      message: lead.message,
      highIntent: lead.highIntent,
      score: lead.score,
    }),
    engagementScore: engagementSignalScore({ score: lead.score, engagementScore: lead.engagementScore }),
  };

  const raw =
    breakdown.completenessScore * 0.22 +
    breakdown.intentScore * 0.2 +
    breakdown.budgetScore * 0.2 +
    breakdown.urgencyScore * 0.18 +
    breakdown.engagementScore * 0.2;

  const score = clamp(Math.round(raw), 0, 100);
  const band = classifyLeadQualityBand(score);

  const strong: string[] = [];
  const weak: string[] = [];

  if (breakdown.completenessScore >= 75) strong.push("Form fields and message look complete enough to qualify.");
  else weak.push("Message or contact fields are thin — completeness score is discounted.");

  if (breakdown.intentScore >= 75) strong.push("Intent language is relatively clear (rule-based).");
  else weak.push("Intent is generic or unclear — expect wider funnel variance.");

  if (breakdown.budgetScore >= 70) strong.push("Budget or valuation hints are present in structured or text signals.");
  else weak.push("Limited budget / price signals — value band is uncertain.");

  if (breakdown.urgencyScore >= 65) strong.push("Urgency or timing cues detected in text or CRM flags.");
  if (breakdown.engagementScore >= 70) strong.push("Engagement / CRM score is elevated for this row.");

  const base: LeadQualitySummary = {
    leadId: lead.id,
    score,
    band,
    breakdown,
    strongSignals: strong.slice(0, 4),
    weakSignals: weak.slice(0, 4),
    suggestedPrice: 0,
    createdAt: new Date().toISOString(),
  };

  base.suggestedPrice = computeLeadSuggestedPrice(base);

  if (opts?.recordMonitoring) {
    recordLeadQualitySummaryBuilt({ band });
  }

  return base;
}
