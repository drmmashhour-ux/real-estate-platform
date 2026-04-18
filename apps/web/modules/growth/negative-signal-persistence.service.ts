/**
 * Persists conservative low-conversion snapshots (admin / jobs — not per page render).
 */
import { negativeSignalQualityFlags } from "@/config/feature-flags";
import {
  upsertCroLowConversionSnapshots,
  upsertRetargetingLowConversionSnapshots,
} from "./cro-retargeting-durability.repository";
import { detectCroLowConversion, detectRetargetingLowConversion } from "./negative-signal-quality.service";

function croGroupKey(row: { entityId: string }): string {
  return `cro:${row.entityId}`;
}

function rtGroupKey(row: { entityId: string }): string {
  return `rt:${row.entityId}`;
}

export async function persistNegativeSignalSnapshotsFromDetection(rangeDays = 14): Promise<{
  croUpserted: number;
  retargetingUpserted: number;
  warnings: string[];
}> {
  const warnings: string[] = [];
  if (!negativeSignalQualityFlags.negativeSignalQualityV1) {
    warnings.push("FEATURE_NEGATIVE_SIGNAL_QUALITY_V1 is off — skipping snapshot persistence.");
    return { croUpserted: 0, retargetingUpserted: 0, warnings };
  }

  const [croRows, rtRows] = await Promise.all([
    detectCroLowConversion(rangeDays),
    detectRetargetingLowConversion(rangeDays),
  ]);

  const croPayload = croRows
    .filter((r) => r.signalType === "LOW_CONVERSION" && r.evidenceQuality !== "LOW")
    .map((r) => ({
      groupKey: croGroupKey(r),
      impressions: r.impressions,
      clicks: r.clicks,
      leads: r.leads,
      bookings: r.bookings,
      conversionRate: r.conversionRate,
      evidenceScore: r.evidenceScore,
      evidenceQuality: r.evidenceQuality,
      reasons: r.reasons,
      warnings: r.warnings,
      metadata: { entityKind: r.entityKind, entityId: r.entityId },
    }));

  const rtPayload = rtRows
    .filter((r) => r.signalType === "LOW_CONVERSION" && r.evidenceQuality !== "LOW")
    .map((r) => {
      const parts = r.entityId.split(":");
      return {
        groupKey: rtGroupKey(r),
        segment: parts[0] ?? null,
        messageId: parts[1] ?? r.entityId,
        messageVariant: null,
        impressions: r.impressions,
        clicks: r.clicks,
        bookings: r.bookings,
        conversionRate: r.conversionRate,
        evidenceScore: r.evidenceScore,
        evidenceQuality: r.evidenceQuality,
        reasons: r.reasons,
        warnings: r.warnings,
        metadata: { entityKind: r.entityKind },
      };
    });

  const croRes = croPayload.length ? await upsertCroLowConversionSnapshots(croPayload) : { upserted: 0 };
  const rtRes = rtPayload.length ? await upsertRetargetingLowConversionSnapshots(rtPayload) : { upserted: 0 };
  return { croUpserted: croRes.upserted, retargetingUpserted: rtRes.upserted, warnings };
}
