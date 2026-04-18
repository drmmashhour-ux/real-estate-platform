import { prisma } from "@/lib/db";
import { createDealPayment, requestPayment } from "@/modules/payments-ops/lecipm-payments.service";

export async function generatePaymentRequestFromTemplate(input: {
  dealId: string;
  template: "deposit_followup" | "balance_on_closing";
  amountCents: number;
  actorUserId: string;
}) {
  const kind =
    input.template === "deposit_followup"
      ? ("deposit" as const)
      : input.template === "balance_on_closing"
        ? ("balance_due" as const)
        : ("fee" as const);

  const pay = await createDealPayment({
    dealId: input.dealId,
    paymentKind: kind,
    amountCents: input.amountCents,
    provider: "manual",
    metadata: { template: input.template },
    actorUserId: input.actorUserId,
  });
  await requestPayment({ dealId: input.dealId, paymentId: pay.id, actorUserId: input.actorUserId });
  return pay;
}
