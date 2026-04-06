/**
 * Smoke: verify orchestration tables exist and support insert/read/delete.
 * Run: `pnpm exec tsx scripts/smoke-orchestrated-tables.ts` from apps/web (DATABASE_URL required).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ select: { id: true } });
  if (!user) {
    console.error("FAIL: no User row — seed DB first");
    process.exit(1);
  }

  const payId = `smoke_op_${Date.now()}`;
  const created = await prisma.orchestratedPayment.create({
    data: {
      provider: "stripe",
      providerPaymentId: payId,
      userId: user.id,
      paymentType: "office_payment",
      amountCents: 50,
      currency: "cad",
      platformFeeCents: 5,
      hostAmountCents: 45,
      status: "pending",
    },
  });

  const read = await prisma.orchestratedPayment.findUnique({ where: { id: created.id } });
  if (!read || read.providerPaymentId !== payId) {
    console.error("FAIL: orchestrated_payments read");
    process.exit(1);
  }

  await prisma.orchestratedPayment.delete({ where: { id: created.id } });

  const payout = await prisma.orchestratedPayout.create({
    data: {
      provider: "stripe",
      hostId: user.id,
      amountCents: 50,
      currency: "cad",
      status: "not_ready",
      bookingId: null,
    },
  });

  const readP = await prisma.orchestratedPayout.findUnique({ where: { id: payout.id } });
  if (!readP) {
    console.error("FAIL: orchestrated_payouts read");
    process.exit(1);
  }

  await prisma.orchestratedPayout.delete({ where: { id: payout.id } });

  console.log("PASS: orchestrated_payments + orchestrated_payouts smoke insert/read/delete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
