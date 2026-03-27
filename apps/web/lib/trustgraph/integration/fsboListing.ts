import { prisma } from "@/lib/db";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { createVerificationCase, getLatestCaseForEntity } from "@/lib/trustgraph/application/createVerificationCase";
import { runVerificationPipelineForCase } from "@/lib/trustgraph/application/runVerificationPipeline";

/**
 * Ensure a TrustGraph case exists for an FSBO listing and optionally rerun the pipeline.
 */
export async function syncTrustGraphForFsboListing(args: {
  listingId: string;
  actorUserId?: string | null;
  runPipeline?: boolean;
}) {
  if (!isTrustGraphEnabled()) return { skipped: true as const };

  let c = await getLatestCaseForEntity("LISTING", args.listingId);
  if (!c) {
    c = await createVerificationCase({
      entityType: "LISTING",
      entityId: args.listingId,
      createdBy: args.actorUserId ?? null,
    });
  }

  if (args.runPipeline) {
    await runVerificationPipelineForCase({
      caseId: c.id,
      actorUserId: args.actorUserId,
    });
  }

  return { skipped: false as const, caseId: c.id };
}

export async function fingerprintListingImage(args: { listingId: string; sha256: string; sourceUrl?: string }) {
  await prisma.mediaContentFingerprint.upsert({
    where: {
      sha256_fsboListingId: { sha256: args.sha256, fsboListingId: args.listingId },
    },
    create: {
      sha256: args.sha256,
      fsboListingId: args.listingId,
      sourceUrl: args.sourceUrl ?? null,
    },
    update: { sourceUrl: args.sourceUrl ?? null },
  });
}
