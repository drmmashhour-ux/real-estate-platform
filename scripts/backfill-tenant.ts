/**
 * Backfills workspace `tenantId` onto rows that belong to the default “core” tenant.
 *
 * Run after migration (nullable tenant columns exist):
 *   pnpm tsx scripts/backfill-tenant.ts
 *
 * Requires DATABASE_URL (e.g. load apps/web `.env.local` before running).
 */
import { prisma } from "@repo/db";

const CORE_SLUG = "core";

async function run() {
  let tenant = await prisma.tenant.findUnique({ where: { slug: CORE_SLUG } });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug: CORE_SLUG,
        name: "LECIPM Core",
      },
    });
    console.log(`Created tenant ${tenant.id} (${CORE_SLUG})`);
  }

  const [listingUp, bookingUp, watchUp, alertUp] = await Promise.all([
    prisma.listing.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    }),
    prisma.booking.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    }),
    prisma.watchlistItem.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    }),
    prisma.alertCandidate.updateMany({
      where: { tenantId: null },
      data: { tenantId: tenant.id },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        tenantId: tenant.id,
        listings: listingUp.count,
        bookings: bookingUp.count,
        watchlistItems: watchUp.count,
        alertCandidates: alertUp.count,
      },
      null,
      2,
    ),
  );
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
