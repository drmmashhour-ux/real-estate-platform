import { createVerificationCase, getLatestCaseForEntity } from "@/lib/trustgraph/application/createVerificationCase";
import { runGuestVerificationPipeline } from "@/lib/trustgraph/infrastructure/services/bnhubVerificationPipeline";

export async function runGuestVerification(args: { userId: string; actorUserId?: string | null }) {
  let c = await getLatestCaseForEntity("GUEST", args.userId);
  if (!c) {
    c = await createVerificationCase({
      entityType: "GUEST",
      entityId: args.userId,
      createdBy: args.actorUserId ?? null,
    });
  }
  return runGuestVerificationPipeline({
    caseId: c.id,
    userId: args.userId,
    actorUserId: args.actorUserId,
  });
}
