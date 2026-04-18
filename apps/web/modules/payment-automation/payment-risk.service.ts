import { prisma } from "@/lib/db";
import type { PaymentRiskFlag } from "./payment-automation.types";

export async function scanPaymentRisks(dealId: string): Promise<PaymentRiskFlag[]> {
  const flags: PaymentRiskFlag[] = [];
  const pays = await prisma.lecipmDealPayment.findMany({ where: { dealId } });

  const awaiting = pays.filter((p) => p.status === "awaiting_confirmation");
  if (awaiting.length > 0) {
    flags.push({
      code: "pending_confirmation",
      severity: "warn",
      message: `${awaiting.length} payment(s) awaiting authorized confirmation.`,
    });
  }

  const modes = await prisma.lecipmTrustWorkflow.findUnique({ where: { dealId } });
  if (!modes) {
    flags.push({
      code: "trust_mode_unset",
      severity: "info",
      message: "Trust workflow not profiled — clarify tracking vs manual vs notary-coordinated.",
    });
  }

  return flags;
}
