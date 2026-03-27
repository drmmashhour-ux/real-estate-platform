import { createVerificationCase, getLatestCaseForEntity } from "@/lib/trustgraph/application/createVerificationCase";
import { runHostVerificationPipeline } from "@/lib/trustgraph/infrastructure/services/bnhubVerificationPipeline";

export async function runHostVerification(args: { hostId: string; actorUserId?: string | null }) {
  let c = await getLatestCaseForEntity("HOST", args.hostId);
  if (!c) {
    c = await createVerificationCase({
      entityType: "HOST",
      entityId: args.hostId,
      createdBy: args.actorUserId ?? null,
    });
  }
  return runHostVerificationPipeline({
    caseId: c.id,
    hostId: args.hostId,
    actorUserId: args.actorUserId,
  });
}
