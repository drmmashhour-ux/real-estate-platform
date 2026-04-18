import { canMutateExecution } from "@/lib/deals/execution-access";
import type { Deal } from "@prisma/client";

export function assertBrokerCanApproveNegotiation(userId: string, role: string | null | undefined, deal: Deal) {
  if (!canMutateExecution(userId, role, deal)) {
    return { ok: false as const, message: "Only the assigned broker or admin can approve negotiation outputs." };
  }
  return { ok: true as const };
}
