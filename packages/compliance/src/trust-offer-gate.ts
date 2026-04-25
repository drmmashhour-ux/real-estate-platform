import { prisma } from "@/lib/db";

export function offerScenarioRequiresTrustDeposit(scenario: unknown): boolean {
  const s = scenario && typeof scenario === "object" ? (scenario as Record<string, unknown>) : null;
  return s?.requiresTrustDeposit === true;
}

/**
 * When `offer.scenario.requiresTrustDeposit` is true, acceptance requires a non-cancelled trust deposit
 * that is not disputed or frozen.
 */
export async function assertTrustDepositAllowsOfferAcceptance(
  offerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { scenario: true },
  });
  if (!offer || !offerScenarioRequiresTrustDeposit(offer.scenario)) {
    return { ok: true };
  }

  const dep = await prisma.trustDeposit.findFirst({
    where: { offerId, NOT: { status: "cancelled" } },
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
