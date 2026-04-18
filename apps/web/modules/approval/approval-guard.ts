import type { Deal } from "@prisma/client";
import { canMutateExecution } from "@/lib/deals/execution-access";

export function requireBrokerApprovalActor(
  userId: string,
  role: string | null | undefined,
  deal: Pick<Deal, "brokerId">,
): { ok: true } | { ok: false; message: string } {
  if (!canMutateExecution(userId, role, deal)) {
    return { ok: false, message: "Broker or admin only." };
  }
  return { ok: true };
}
