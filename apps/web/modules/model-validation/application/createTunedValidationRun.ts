import type { PrismaClient } from "@prisma/client";
import { addValidationItem } from "./addValidationItem";
import { compareValidationRuns } from "./compareValidationRuns";
import {
  createRun,
  getRunWithItems,
  updateRunStatus,
} from "../infrastructure/validationRepository";
import { sampleFreshValidationListings } from "../infrastructure/validationSamplingService";

export async function createTunedSameSetValidationRun(
  db: PrismaClient,
  input: {
    baselineRunId: string;
    tuningProfileId: string;
    name?: string | null;
    createdBy?: string | null;
    compareToBaseline?: boolean;
  },
) {
  const baseline = await getRunWithItems(db, input.baselineRunId);
  if (!baseline) throw new Error("Baseline run not found");
  if (!baseline.items.length) throw new Error("Baseline run has no items");

  const run = await createRun(db, {
    name:
      input.name ??
      `Tuned same-set (${baseline.name?.trim() || baseline.id.slice(0, 8)})`,
    validationRunKind: "tuned_same_set",
    appliedTuningProfileId: input.tuningProfileId,
    comparisonTargetRunId: input.baselineRunId,
    createdBy: input.createdBy ?? null,
    status: "draft",
  });

  for (const item of baseline.items) {
    await addValidationItem(db, run.id, {
      entityType: item.entityType,
      entityId: item.entityId,
      tuningProfileId: input.tuningProfileId,
      fillFromEngine: true,
      humanTrustLabel: item.humanTrustLabel,
      humanDealLabel: item.humanDealLabel,
      humanRiskLabel: item.humanRiskLabel,
      fairnessRating: item.fairnessRating,
      wouldPublish: item.wouldPublish,
      wouldContact: item.wouldContact,
      wouldInvestigateFurther: item.wouldInvestigateFurther,
      needsManualReview: item.needsManualReview,
      reviewerNotes: item.reviewerNotes,
    });
  }

  const nextStatus = baseline.status === "completed" ? "completed" : "in_progress";
  await updateRunStatus(
    db,
    run.id,
    nextStatus,
    nextStatus === "completed" ? new Date() : null,
  );

  const withItems = await getRunWithItems(db, run.id);
  if (!withItems) throw new Error("Failed to load run");

  let comparison: Awaited<ReturnType<typeof compareValidationRuns>> | null = null;
  if (input.compareToBaseline !== false) {
    comparison = await compareValidationRuns(db, input.baselineRunId, run.id);
  }

  return { run: withItems, comparison };
}

export async function createTunedFreshSetValidationRun(
  db: PrismaClient,
  input: {
    tuningProfileId: string;
    baselineRunId: string;
    name?: string | null;
    createdBy?: string | null;
    excludeEntityIds?: string[];
    compareToBaseline?: boolean;
    compareToSameSetRunId?: string | null;
  },
) {
  const baseline = await getRunWithItems(db, input.baselineRunId);
  if (!baseline) throw new Error("Baseline run not found");

  const exclude = new Set<string>([...(input.excludeEntityIds ?? []), ...baseline.items.map((i) => i.entityId)]);
  const sample = await sampleFreshValidationListings(db, { excludeIds: [...exclude] });

  const run = await createRun(db, {
    name: input.name ?? `Tuned fresh 50 (${baseline.name?.trim() || baseline.id.slice(0, 8)})`,
    validationRunKind: "tuned_fresh_set",
    appliedTuningProfileId: input.tuningProfileId,
    comparisonTargetRunId: input.baselineRunId,
    createdBy: input.createdBy ?? null,
    status: "draft",
  });

  for (const listingId of sample.listingIds) {
    await addValidationItem(db, run.id, {
      entityType: "fsbo_listing",
      entityId: listingId,
      tuningProfileId: input.tuningProfileId,
      fillFromEngine: true,
    });
  }

  await updateRunStatus(db, run.id, "in_progress", null);

  const withItems = await getRunWithItems(db, run.id);
  if (!withItems) throw new Error("Failed to load run");

  let comparisonBaseline: Awaited<ReturnType<typeof compareValidationRuns>> | null = null;
  let comparisonSame: Awaited<ReturnType<typeof compareValidationRuns>> | null = null;

  if (input.compareToBaseline !== false) {
    comparisonBaseline = await compareValidationRuns(db, input.baselineRunId, run.id);
  }
  if (input.compareToSameSetRunId) {
    comparisonSame = await compareValidationRuns(db, input.compareToSameSetRunId, run.id);
  }

  return {
    run: withItems,
    sampling: sample,
    comparisonBaseline,
    comparisonSame,
  };
}
