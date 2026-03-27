import { createVerificationCase, getLatestCaseForEntity } from "@/lib/trustgraph/application/createVerificationCase";
import { runMortgageReadinessPipeline } from "@/lib/trustgraph/infrastructure/services/mortgageVerificationPipeline";

export async function runMortgageReadinessVerification(args: {
  mortgageRequestId: string;
  actorUserId?: string | null;
}) {
  let c = await getLatestCaseForEntity("MORTGAGE_FILE", args.mortgageRequestId);
  if (!c) {
    c = await createVerificationCase({
      entityType: "MORTGAGE_FILE",
      entityId: args.mortgageRequestId,
      createdBy: args.actorUserId ?? null,
    });
  }
  return runMortgageReadinessPipeline({
    caseId: c.id,
    mortgageRequestId: args.mortgageRequestId,
    actorUserId: args.actorUserId,
  });
}
