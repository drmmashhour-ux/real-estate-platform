import { createVerificationCase, getLatestCaseForEntity } from "@/lib/trustgraph/application/createVerificationCase";
import { runBookingRiskPipeline } from "@/lib/trustgraph/infrastructure/services/bnhubVerificationPipeline";

export async function runBookingRiskEvaluation(args: { bookingId: string; actorUserId?: string | null }) {
  let c = await getLatestCaseForEntity("BOOKING", args.bookingId);
  if (!c) {
    c = await createVerificationCase({
      entityType: "BOOKING",
      entityId: args.bookingId,
      createdBy: args.actorUserId ?? null,
    });
  }
  return runBookingRiskPipeline({
    caseId: c.id,
    bookingId: args.bookingId,
    actorUserId: args.actorUserId,
  });
}
