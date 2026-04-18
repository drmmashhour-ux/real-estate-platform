/**
 * Conservative negative-signal detection + evidence classification (wraps Phase 2 SQL heuristics).
 */
import { computeEvidenceScore } from "@/modules/ads/ads-evidence-score.service";
import {
  detectLowConversionRetargetingMessages,
  detectLowConversionSurfaces,
  type LowConversionRow,
} from "./cro-low-conversion.service";

export type NegativeSignalEvidenceInput = {
  impressions: number;
  clicks: number;
  leads: number;
  bookings: number;
  windowDays?: number;
};

export type NegativeSignalEvidenceClass = "INSUFFICIENT" | "LOW" | "MEDIUM" | "HIGH";

export function computeNegativeSignalEvidenceScore(input: NegativeSignalEvidenceInput): number {
  return computeEvidenceScore({
    impressions: input.impressions,
    clicks: input.clicks,
    leads: input.leads,
    spendKnown: true,
    cplComputable: input.leads > 0,
    conversionComputable: input.bookings > 0,
    windowDays: input.windowDays ?? 14,
  });
}

export function classifyNegativeSignalEvidence(input: NegativeSignalEvidenceInput): {
  quality: NegativeSignalEvidenceClass;
  score: number;
  warnings: string[];
} {
  const score = computeNegativeSignalEvidenceScore(input);
  const warnings: string[] = [];
  if (input.clicks < 15) warnings.push("Low click volume — avoid strong negative claims.");
  if (input.impressions > 0 && input.impressions < 80) warnings.push("Low impression coverage in window.");
  let quality: NegativeSignalEvidenceClass = "INSUFFICIENT";
  if (score >= 0.55 && input.clicks >= 20) quality = "MEDIUM";
  else if (score >= 0.38 && input.clicks >= 15) quality = "LOW";
  else if (score < 0.25 || input.clicks < 10) quality = "INSUFFICIENT";
  else quality = "LOW";
  return { quality, score, warnings };
}

export async function detectCroLowConversion(rangeDays = 14): Promise<LowConversionRow[]> {
  return detectLowConversionSurfaces(rangeDays);
}

export async function detectRetargetingLowConversion(rangeDays = 14): Promise<LowConversionRow[]> {
  return detectLowConversionRetargetingMessages(rangeDays);
}
