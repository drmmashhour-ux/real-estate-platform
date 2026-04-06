/**
 * Verifies Prisma can read BNHub money-layer columns/tables (migration applied).
 * Run from apps/web: `pnpm exec tsx scripts/bnhub-money-layer-schema-verify.ts`
 */
import { prisma } from "../lib/db";

async function main() {
  await prisma.payment.findFirst({
    select: { id: true, moneyBreakdownJson: true, paidAt: true },
  });
  await prisma.orchestratedPayout.findFirst({
    select: {
      id: true,
      payoutMethod: true,
      failureReason: true,
      availableAt: true,
      paidAt: true,
      stripePayoutId: true,
    },
  });
  await prisma.bnhubManualHostPayout.findFirst({ select: { id: true } });
  await prisma.hostStripeAccountSnapshot.findFirst({ select: { id: true } });
  console.log("OK: bnhub money layer schema reachable");
}

main()
  .catch((e) => {
    console.error("FAIL:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
