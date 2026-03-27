/**
 * Demo scenarios for TrustGraph (run manually from apps/web):
 *   TRUSTGRAPH_ENABLED=true npx tsx prisma/seed-trustgraph-demo.ts
 */
import { prisma } from "../lib/db";
import { createVerificationCase } from "../lib/trustgraph/application/createVerificationCase";
import { runVerificationPipelineForCase } from "../lib/trustgraph/application/runVerificationPipeline";

async function main() {
  const listing = await prisma.fsboListing.findFirst({
    where: { status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, ownerId: true },
  });
  if (!listing) {
    console.log("No draft FSBO listing found — create one in Seller Hub first.");
    return;
  }

  await prisma.mediaContentFingerprint.deleteMany({
    where: { fsboListingId: listing.id },
  });
  await prisma.mediaContentFingerprint.createMany({
    data: [{ sha256: "demo_dup_hash_1", fsboListingId: listing.id, sourceUrl: "https://example.com/a.jpg" }],
  });

  const other = await prisma.fsboListing.findFirst({
    where: { id: { not: listing.id } },
    select: { id: true },
  });
  if (other) {
    await prisma.mediaContentFingerprint.create({
      data: { sha256: "demo_dup_hash_1", fsboListingId: other.id, sourceUrl: "https://example.com/b.jpg" },
    });
  }

  const c = await createVerificationCase({
    entityType: "LISTING",
    entityId: listing.id,
    createdBy: listing.ownerId,
  });

  await runVerificationPipelineForCase({
    caseId: c.id,
    actorUserId: listing.ownerId,
  });

  console.log("TrustGraph demo seeded for listing", listing.id, "case", c.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
