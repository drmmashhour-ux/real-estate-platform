import { prisma } from "@/lib/db";
import { normalizeConfidence } from "@/lib/ai/confidence";
import type { OutcomeType } from "./feedback-score";

const MIN_SAMPLES = 5;
const LOW_RATE = 0.35;
const HIGH_RATE = 0.65;

export function confidenceToBucket(confidence: number): string {
  const c = normalizeConfidence(confidence);
  const pct = Math.floor(c * 100);
  if (pct < 20) return "0-20";
  if (pct < 40) return "20-40";
  if (pct < 60) return "40-60";
  if (pct < 80) return "60-80";
  return "80-100";
}

function isSuccessOutcome(outcomeType: OutcomeType): boolean {
  return outcomeType === "approved" || outcomeType === "applied" || outcomeType === "success";
}

/** Adjust raw confidence given observed success rate in-bucket (pure, for tests). */
export function adjustConfidenceByRate(raw: number, successRate: number | null, total: number): number {
  const r = normalizeConfidence(raw);
  if (total < MIN_SAMPLES || successRate === null || !Number.isFinite(successRate)) return r;
  if (successRate < LOW_RATE) return Math.max(0, r * 0.85);
  if (successRate > HIGH_RATE) return Math.min(1, r * 1.05);
  return r;
}

export async function recordConfidence(
  ruleName: string,
  confidence: number,
  outcomeType: OutcomeType
): Promise<void> {
  const bucket = confidenceToBucket(confidence);
  const ok = isSuccessOutcome(outcomeType);

  await prisma.aiConfidenceCalibration.upsert({
    where: {
      ruleName_bucket: { ruleName, bucket },
    },
    create: {
      ruleName,
      bucket,
      total: 1,
      successCount: ok ? 1 : 0,
    },
    update: {
      total: { increment: 1 },
      ...(ok ? { successCount: { increment: 1 } } : {}),
    },
  });
}

export async function getCalibratedConfidence(ruleName: string, rawConfidence: number): Promise<number> {
  const raw = normalizeConfidence(rawConfidence);
  const bucket = confidenceToBucket(raw);
  const row = await prisma.aiConfidenceCalibration.findUnique({
    where: { ruleName_bucket: { ruleName, bucket } },
    select: { total: true, successCount: true },
  });
  if (!row || row.total < MIN_SAMPLES) return raw;
  const rate = row.successCount / row.total;
  return adjustConfidenceByRate(raw, rate, row.total);
}

