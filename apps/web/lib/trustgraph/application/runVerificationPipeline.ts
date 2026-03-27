import { prisma } from "@/lib/db";
import { runBrokerVerification } from "@/lib/trustgraph/application/runBrokerVerification";
import { runFsboListingVerificationPipeline } from "@/lib/trustgraph/infrastructure/services/verificationPipeline";
import { runSellerDeclarationVerification } from "@/lib/trustgraph/application/runSellerDeclarationVerification";
import {
  runBookingRiskPipeline,
  runGuestVerificationPipeline,
  runHostVerificationPipeline,
  runShortTermListingVerificationPipeline,
} from "@/lib/trustgraph/infrastructure/services/bnhubVerificationPipeline";
import { runMortgageReadinessPipeline } from "@/lib/trustgraph/infrastructure/services/mortgageVerificationPipeline";

/**
 * Dispatches the correct deterministic pipeline from the verification case row.
 */
export async function runVerificationPipelineForCase(args: { caseId: string; actorUserId?: string | null }) {
  const c = await prisma.verificationCase.findUnique({
    where: { id: args.caseId },
    select: { id: true, entityType: true, entityId: true },
  });
  if (!c) return { ok: false as const, error: "Case not found" };

  switch (c.entityType) {
    case "LISTING":
      return runFsboListingVerificationPipeline({
        caseId: c.id,
        listingId: c.entityId,
        actorUserId: args.actorUserId,
      });
    case "SELLER_DECLARATION":
      return runSellerDeclarationVerification({
        caseId: c.id,
        listingId: c.entityId,
        actorUserId: args.actorUserId,
      });
    case "BROKER":
      return runBrokerVerification({
        caseId: c.id,
        userId: c.entityId,
        actorUserId: args.actorUserId,
      });
    case "HOST":
      return runHostVerificationPipeline({
        caseId: c.id,
        hostId: c.entityId,
        actorUserId: args.actorUserId,
      });
    case "GUEST":
      return runGuestVerificationPipeline({
        caseId: c.id,
        userId: c.entityId,
        actorUserId: args.actorUserId,
      });
    case "SHORT_TERM_LISTING":
      return runShortTermListingVerificationPipeline({
        caseId: c.id,
        listingId: c.entityId,
        actorUserId: args.actorUserId,
      });
    case "BOOKING":
      return runBookingRiskPipeline({
        caseId: c.id,
        bookingId: c.entityId,
        actorUserId: args.actorUserId,
      });
    case "MORTGAGE_FILE":
      return runMortgageReadinessPipeline({
        caseId: c.id,
        mortgageRequestId: c.entityId,
        actorUserId: args.actorUserId,
      });
    default:
      return { ok: false as const, error: `Pipeline not implemented for entity type ${c.entityType}` };
  }
}
