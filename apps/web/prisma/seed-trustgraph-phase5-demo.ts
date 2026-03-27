/**
 * Phase 5 TrustGraph demo scenarios — run from apps/web:
 *   TRUSTGRAPH_ENABLED=true TRUSTGRAPH_RANKING_BOOST_ENABLED=true npx tsx prisma/seed-trustgraph-phase5-demo.ts
 */
import { prisma } from "../lib/db";
import { createVerificationCase } from "../lib/trustgraph/application/createVerificationCase";
import { runVerificationPipelineForCase } from "../lib/trustgraph/application/runVerificationPipeline";
import { runBookingRiskEvaluation } from "../lib/trustgraph/application/runBookingRiskEvaluation";
import { runHostVerification } from "../lib/trustgraph/application/runHostVerification";
import { runMortgageReadinessVerification } from "../lib/trustgraph/application/runMortgageReadinessVerification";

async function main() {
  const listing = await prisma.fsboListing.findFirst({
    where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    select: { id: true, ownerId: true },
  });
  if (listing) {
    const c = await createVerificationCase({
      entityType: "LISTING",
      entityId: listing.id,
      createdBy: listing.ownerId,
    });
    await runVerificationPipelineForCase({ caseId: c.id, actorUserId: listing.ownerId });
    console.log("LISTING case:", c.id);
  } else {
    console.log("No active FSBO listing — skip listing ranking demo.");
  }

  const host = await prisma.bnhubHost.findFirst({ select: { id: true } });
  if (host) {
    await runHostVerification({ hostId: host.id, actorUserId: null });
    console.log("HOST verification run for", host.id);
  }

  const booking = await prisma.booking.findFirst({ select: { id: true } });
  if (booking) {
    await runBookingRiskEvaluation({ bookingId: booking.id, actorUserId: null });
    console.log("BOOKING risk run for", booking.id);
  }

  const mortgage = await prisma.mortgageRequest.findFirst({ select: { id: true, userId: true } });
  if (mortgage) {
    await runMortgageReadinessVerification({ mortgageRequestId: mortgage.id, actorUserId: mortgage.userId });
    console.log("MORTGAGE_FILE readiness run for", mortgage.id);
  }

  console.log("Phase 5 seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
