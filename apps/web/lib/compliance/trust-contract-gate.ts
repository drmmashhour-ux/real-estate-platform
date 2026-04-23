import { prisma } from "@/lib/db";

export function contractContentRequiresTrustDeposit(content: unknown): boolean {
  const c = content && typeof content === "object" ? (content as Record<string, unknown>) : null;
  return c?.requiresTrustDeposit === true;
}

/**
 * When `contract.content.requiresTrustDeposit` is true, full execution requires a trust deposit
 * in an actionable state (mirrors offer acceptance gate).
 */
export async function assertTrustDepositAllowsContractCompletion(
  contractId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { content: true },
  });
  if (!contract || !contractContentRequiresTrustDeposit(contract.content)) {
    return { ok: true };
  }

  const dep = await prisma.trustDeposit.findFirst({
    where: { contractId, NOT: { status: "cancelled" } },
    orderBy: { createdAt: "desc" },
  });

  if (!dep) {
    return { ok: false, error: "TRUST_DEPOSIT_REQUIRED" };
  }

  if (dep.status === "disputed" || dep.status === "frozen") {
    return { ok: false, error: "TRUST_DEPOSIT_NOT_ACTIONABLE" };
  }

  if (dep.status === "pending_receipt") {
    return { ok: false, error: "TRUST_DEPOSIT_PENDING_RECEIPT" };
  }

  if (dep.status === "released" || dep.status === "refunded") {
    return { ok: false, error: "TRUST_DEPOSIT_NOT_ACTIVE" };
  }

  return { ok: true };
}
