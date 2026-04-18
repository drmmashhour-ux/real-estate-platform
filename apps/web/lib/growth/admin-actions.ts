"use server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  backfillCroLearningSignalsFromRecentEvents,
  runNegativeSignalDetectionBackfill,
} from "@/modules/growth/durability-backfill.service";
import { getDurabilityHealth } from "@/modules/growth/cro-retargeting-durability.repository";
import { detectCroLowConversion, detectRetargetingLowConversion } from "@/modules/growth/negative-signal-quality.service";

async function requireAdminGrowth() {
  const s = await requireAdminSession();
  if (!s.ok) throw new Error(s.error);
  return s.userId;
}

export async function runDurabilityBackfillAction(rangeDays?: number) {
  await requireAdminGrowth();
  return backfillCroLearningSignalsFromRecentEvents(rangeDays ?? 14);
}

export async function runNegativeSignalDetectionAction(rangeDays?: number) {
  await requireAdminGrowth();
  return runNegativeSignalDetectionBackfill(rangeDays ?? 14);
}

export async function getCroRetargetingDurabilityHealthAction() {
  await requireAdminGrowth();
  return getDurabilityHealth();
}

export async function getNegativeSignalQualitySummaryAction(rangeDays?: number) {
  await requireAdminGrowth();
  const d = rangeDays ?? 14;
  const [cro, rt] = await Promise.all([detectCroLowConversion(d), detectRetargetingLowConversion(d)]);
  return {
    croRows: cro.length,
    retargetingRows: rt.length,
    croLow: cro.filter((x) => x.signalType === "LOW_CONVERSION").length,
    rtLow: rt.filter((x) => x.signalType === "LOW_CONVERSION").length,
  };
}
