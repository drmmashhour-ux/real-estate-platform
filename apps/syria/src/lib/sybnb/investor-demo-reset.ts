import type { Prisma, PrismaClient } from "@/generated/prisma";
import { assertDemoWriteAllowed } from "@/lib/sybnb/investor-demo-write-guard";

/** Investor-demo destructive reset — production blocked unless INVESTOR_DEMO_ALLOW_SEED_IN_PRODUCTION=true (see investor-demo-write-guard). */

const MAX_DEMO_ROWS_PER_RESET = 1000;

/** Canonical JSON marker for seeded investor-demo rows (Syria-only). */
export const INVESTOR_DEMO_META = { demo: true, source: "investor-demo" } as const;

/**
 * Remove only investor-demo rows (DEMO_ emails/titles or demo_meta.demo === true).
 * Order respects FKs. Aborts if more than {@link MAX_DEMO_ROWS_PER_RESET} rows would be touched.
 */
export async function resetInvestorDemoData(client: PrismaClient): Promise<void> {
  assertDemoWriteAllowed("reset");

  const demoUsers = await client.syriaAppUser.findMany({
    where: {
      OR: [
        { email: { startsWith: "DEMO_" } },
        { email: { contains: "investor.sybnb.demo" } },
        {
          demoMeta: {
            path: ["demo"],
            equals: true,
          },
        },
      ],
    },
    select: { id: true },
  });
  const demoUserIds = demoUsers.map((u) => u.id);

  const demoProps = await client.syriaProperty.findMany({
    where: {
      OR: [
        { titleAr: { startsWith: "DEMO" } },
        {
          demoMeta: {
            path: ["demo"],
            equals: true,
          },
        },
      ],
    },
    select: { id: true },
  });
  const propIds = demoProps.map((p) => p.id);

  const syriaBookOr: Prisma.SyriaBookingWhereInput[] = [];
  if (propIds.length > 0) {
    syriaBookOr.push({ propertyId: { in: propIds } });
  }
  if (demoUserIds.length > 0) {
    syriaBookOr.push({ guestId: { in: demoUserIds } });
  }
  syriaBookOr.push({
    demoMeta: {
      path: ["demo"],
      equals: true,
    },
  });

  const sybnbBookingOr: Prisma.SybnbBookingWhereInput[] = [];
  if (propIds.length > 0) {
    sybnbBookingOr.push({ listingId: { in: propIds } });
  }
  if (demoUserIds.length > 0) {
    sybnbBookingOr.push({ guestId: { in: demoUserIds } }, { hostId: { in: demoUserIds } });
  }

  const estBookings =
    syriaBookOr.length > 0
      ? await client.syriaBooking.count({
          where: { OR: syriaBookOr },
        })
      : 0;

  const estSybnb =
    sybnbBookingOr.length > 0
      ? await client.sybnbBooking.count({
          where: { OR: sybnbBookingOr },
        })
      : 0;

  const growthWhere: Prisma.SyriaGrowthEventWhereInput =
    demoUserIds.length === 0 && propIds.length === 0
      ? {
          OR: [
            { eventType: { startsWith: "demo_" } },
            {
              payload: {
                path: ["demo"],
                equals: true,
              },
            },
          ],
        }
      : {
          OR: [
            ...(demoUserIds.length > 0 ? [{ userId: { in: demoUserIds } }] : []),
            ...(propIds.length > 0 ? [{ propertyId: { in: propIds } }] : []),
            { eventType: { startsWith: "demo_" } },
            {
              payload: {
                path: ["demo"],
                equals: true,
              },
            },
          ],
        };

  const estGrowth = await client.syriaGrowthEvent.count({ where: growthWhere });

  const deletedCount = demoUsers.length + demoProps.length + estBookings + estSybnb + estGrowth;
  if (deletedCount > MAX_DEMO_ROWS_PER_RESET) {
    throw new Error("❌ Too many rows affected — aborting reset");
  }

  if (syriaBookOr.length > 0) {
    const sids = (
      await client.syriaBooking.findMany({
        where: { OR: syriaBookOr },
        select: { id: true },
      })
    ).map((s) => s.id);
    if (sids.length > 0) {
      await client.syriaPayout.deleteMany({ where: { bookingId: { in: sids } } });
      await client.syriaSybnbCoreAudit.deleteMany({ where: { bookingId: { in: sids } } });
    }
    await client.syriaBooking.deleteMany({ where: { OR: syriaBookOr } });
  }

  if (sybnbBookingOr.length > 0) {
    const bid = (
      await client.sybnbBooking.findMany({
        where: { OR: sybnbBookingOr },
        select: { id: true },
      })
    ).map((b) => b.id);
    if (bid.length > 0) {
      await client.sybnbPaymentAudit.deleteMany({ where: { bookingId: { in: bid } } });
    }
    await client.sybnbBooking.deleteMany({ where: { OR: sybnbBookingOr } });
  }

  await client.syriaGrowthEvent.deleteMany({ where: growthWhere });

  if (propIds.length > 0) {
    await client.listingReport.deleteMany({ where: { listingId: { in: propIds } } });
    await client.sybnbListingImage.deleteMany({ where: { propertyId: { in: propIds } } });
    await client.syriaProperty.deleteMany({ where: { id: { in: propIds } } });
  }

  if (demoUserIds.length > 0) {
    await client.syriaPhoneOtp.deleteMany({ where: { userId: { in: demoUserIds } } });
    await client.syriaAppUser.deleteMany({ where: { id: { in: demoUserIds } } });
  }

  console.warn("[DEMO MODE]", {
    action: "reset",
    timestamp: new Date().toISOString(),
  });
}
