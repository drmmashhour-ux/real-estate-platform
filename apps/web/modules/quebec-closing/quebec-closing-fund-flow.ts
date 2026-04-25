import type { LecipmDealPayment } from "@prisma/client";

/** Surface LECIPM deal payments for closing fund-flow (deposit, balance, release). */
export function summarizeClosingFundFlow(payments: LecipmDealPayment[]) {
  const deposit = payments.filter((p) => p.paymentKind === "deposit");
  const mortgageOrBalance = payments.filter((p) =>
    ["balance_due", "additional_sum", "trust_release"].includes(p.paymentKind),
  );
  const disbursement = payments.filter((p) => p.status === "released" || p.paymentKind === "trust_release");

  return {
    rows: payments.map((p) => ({
      id: p.id,
      paymentKind: p.paymentKind,
      status: p.status,
      amountCents: p.amountCents,
      currency: p.currency,
      receivedAt: p.receivedAt,
      confirmedAt: p.confirmedAt,
      releasedAt: p.releasedAt,
      provider: p.provider,
    })),
    counts: {
      deposit: deposit.length,
      balanceOrMortgageRelated: mortgageOrBalance.length,
      released: disbursement.length,
    },
  };
}
