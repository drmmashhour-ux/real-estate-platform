import { escalateOverdueCaseRecords } from "@/lib/trustgraph/infrastructure/services/queueEscalationService";

export async function escalateOverdueCases(args: { workspaceId: string }) {
  return escalateOverdueCaseRecords(args.workspaceId);
}
