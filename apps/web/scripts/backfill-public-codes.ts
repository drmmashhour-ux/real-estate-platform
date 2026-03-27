/**
 * One-off: assign BKG-/DEL-/DSP- codes where missing. Run: npx tsx scripts/backfill-public-codes.ts
 */
import { prisma } from "../lib/db";
import { generateBookingCode, generateDealCode, generateDisputeCode } from "../lib/codes/generate-code";

async function main() {
  const bookings = await prisma.booking.findMany({
    where: { bookingCode: null },
    select: { id: true },
    take: 5000,
  });
  for (const b of bookings) {
    await prisma.$transaction(async (tx) => {
      const code = await generateBookingCode(tx);
      await tx.booking.update({ where: { id: b.id }, data: { bookingCode: code } });
    });
  }
  console.log(`Bookings updated: ${bookings.length}`);

  const deals = await prisma.deal.findMany({
    where: { dealCode: null },
    select: { id: true },
    take: 5000,
  });
  for (const d of deals) {
    await prisma.$transaction(async (tx) => {
      const code = await generateDealCode(tx);
      await tx.deal.update({ where: { id: d.id }, data: { dealCode: code } });
    });
  }
  console.log(`Deals updated: ${deals.length}`);

  const disputes = await prisma.platformLegalDispute.findMany({
    where: { disputeCode: null },
    select: { id: true },
    take: 5000,
  });
  for (const d of disputes) {
    await prisma.$transaction(async (tx) => {
      const code = await generateDisputeCode(tx);
      await tx.platformLegalDispute.update({ where: { id: d.id }, data: { disputeCode: code } });
    });
  }
  console.log(`Disputes updated: ${disputes.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
