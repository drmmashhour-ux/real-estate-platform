/**
 * Phase 4 TrustGraph demo scenarios — run from apps/web:
 *   TRUSTGRAPH_ENABLED=true npx tsx prisma/seed-trustgraph-phase4-demo.ts
 *
 * Creates fingerprint rows and optional second listing for duplicate-hash demos.
 * Does not create full “verified condo” rows (use Seller Hub + this script together).
 */
import { prisma } from "../lib/db";
import { createVerificationCase } from "../lib/trustgraph/application/createVerificationCase";
import { runVerificationPipelineForCase } from "../lib/trustgraph/application/runVerificationPipeline";

async function main() {
  const listing = await prisma.fsboListing.findFirst({
    where: { status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, ownerId: true, title: true },
  });
  if (!listing) {
    console.log("No draft FSBO listing — create one in Seller Hub first.");
    return;
  }

  console.log("Demo base listing:", listing.id, listing.title);

  // 10) duplicate media across listings
  await prisma.mediaContentFingerprint.deleteMany({
    where: { fsboListingId: listing.id },
  });
  await prisma.mediaContentFingerprint.createMany({
    data: [{ sha256: "phase4_dup_demo_hash", fsboListingId: listing.id, sourceUrl: "https://example.com/demo-a.jpg" }],
  });
  const other = await prisma.fsboListing.findFirst({
    where: { id: { not: listing.id } },
    select: { id: true },
  });
  if (other) {
    await prisma.mediaContentFingerprint.deleteMany({ where: { fsboListingId: other.id, sha256: "phase4_dup_demo_hash" } });
    await prisma.mediaContentFingerprint.create({
      data: { sha256: "phase4_dup_demo_hash", fsboListingId: other.id, sourceUrl: "https://example.com/demo-b.jpg" },
    });
    console.log("Cross-listing duplicate fingerprint seeded on second listing:", other.id);
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

  console.log("Verification case:", c.id, "— pipeline run complete.");
  console.log("Manual QA: condo missing unit, free-plan photos, exterior tag — use Seller Hub + TRUSTGRAPH_ENABLED=true.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
