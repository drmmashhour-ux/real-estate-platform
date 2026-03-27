import type { PrismaClient } from "@prisma/client";
import type { CompositionTargets } from "../domain/calibration.types";
import {
  createBatchItems,
  createCalibrationBatch as createBatchRow,
  getActiveTuningProfile,
} from "../infrastructure/calibrationRepository";
import { buildListingSegmentJson, collectLabeledItemsFromValidationRuns } from "../infrastructure/batchSamplingService";

export async function createCalibrationBatch(
  db: PrismaClient,
  input: {
    name?: string | null;
    description?: string | null;
    sourceValidationRunIds: string[];
    targetMinItems?: number;
    targetMaxItems?: number;
    compositionTargets?: Partial<CompositionTargets> | null;
    activeTuningProfileId?: string | null;
    createdBy?: string | null;
  },
) {
  if (!input.sourceValidationRunIds.length) {
    throw new Error("sourceValidationRunIds is required");
  }

  const targetMin = input.targetMinItems ?? 25;
  const targetMax = input.targetMaxItems ?? 50;

  let activeId = input.activeTuningProfileId ?? null;
  if (!activeId) {
    const active = await getActiveTuningProfile(db);
    activeId = active?.id ?? null;
  }

  const collected = await collectLabeledItemsFromValidationRuns(db, {
    runIds: input.sourceValidationRunIds,
    targetMin,
    targetMax,
    composition: input.compositionTargets ?? undefined,
  });

  if (!collected.length) {
    throw new Error("No fully labeled items found for the given validation runs.");
  }

  const batch = await createBatchRow(db, {
    name: input.name ?? `Calibration ${new Date().toISOString().slice(0, 10)}`,
    description: input.description ?? null,
    sourceValidationRunIds: input.sourceValidationRunIds,
    activeTuningProfileId: activeId,
    targetMinItems: targetMin,
    targetMaxItems: targetMax,
    compositionTargets: input.compositionTargets ?? undefined,
    createdBy: input.createdBy ?? null,
    status: "draft",
  });

  const rows = await Promise.all(
    collected.map(async (r) => {
      let segmentJson: ReturnType<typeof buildListingSegmentJson> | null = null;
      if (r.entityType === "fsbo_listing") {
        const listing = await db.fsboListing.findUnique({
          where: { id: r.entityId },
          select: {
            propertyType: true,
            listingDealType: true,
            tenantId: true,
            listingOwnerType: true,
            city: true,
          },
        });
        if (listing) segmentJson = buildListingSegmentJson(listing);
      }
      return {
        entityType: r.entityType,
        entityId: r.entityId,
        sourceRunId: r.sourceRunId,
        humanTrustLabel: r.humanTrustLabel,
        humanDealLabel: r.humanDealLabel,
        humanRiskLabel: r.humanRiskLabel,
        fairnessRating: r.fairnessRating,
        needsManualReview: r.needsManualReview,
        notes: r.notes,
        segmentJson: segmentJson ?? undefined,
      };
    }),
  );

  await createBatchItems(db, batch.id, rows);

  return db.calibrationBatch.findUnique({
    where: { id: batch.id },
    include: { items: true, activeTuningProfile: { select: { id: true, name: true } } },
  });
}
