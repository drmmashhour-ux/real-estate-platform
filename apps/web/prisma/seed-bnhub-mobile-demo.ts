/**
 * Optional demo rows for BNHUB mobile + safety engine.
 * Run: npx tsx prisma/seed-bnhub-mobile-demo.ts
 * Requires existing published `ShortTermListing` rows.
 */
import { PrismaClient, BnhubSafetyReviewStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.shortTermListing.findMany({
    where: { listingStatus: "PUBLISHED" },
    select: { id: true, title: true },
    take: 8,
  });
  if (listings.length === 0) {
    console.log("No published listings — skip BNHUB mobile demo seed.");
    return;
  }

  await prisma.bnhubRestrictedZone.createMany({
    data: [
      {
        id: "demo-zone-montreal-core",
        name: "Demo policy zone (Montreal core)",
        boundaryGeoJson: {
          type: "Polygon",
          coordinates: [
            [
              [-73.65, 45.45],
              [-73.45, 45.45],
              [-73.45, 45.58],
              [-73.65, 45.58],
              [-73.65, 45.45],
            ],
          ],
        },
        policyNotes: "Illustrative geofence for admin tools — not a crime or safety score.",
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  const [a, b, c] = [listings[0], listings[1], listings[2]].filter(Boolean);

  if (a) {
    await prisma.bnhubListingSafetyProfile.upsert({
      where: { listingId: a.id },
      create: {
        listingId: a.id,
        reviewStatus: BnhubSafetyReviewStatus.APPROVED,
        publicMessageKey: "approved",
        bookingAllowed: true,
        listingVisible: true,
      },
      update: {},
    });
  }
  if (b) {
    await prisma.bnhubListingSafetyProfile.upsert({
      where: { listingId: b.id },
      create: {
        listingId: b.id,
        reviewStatus: BnhubSafetyReviewStatus.MANUAL_REVIEW_REQUIRED,
        publicMessageKey: "safety_review_in_progress",
        bookingAllowed: false,
        listingVisible: true,
        requiresExteriorPhoto: true,
      },
      update: {},
    });
  }
  if (c) {
    await prisma.bnhubListingSafetyProfile.upsert({
      where: { listingId: c.id },
      create: {
        listingId: c.id,
        reviewStatus: BnhubSafetyReviewStatus.RESTRICTED,
        publicMessageKey: "listing_unavailable",
        bookingAllowed: false,
        listingVisible: false,
      },
      update: {},
    });
  }

  console.log("BNHUB mobile demo safety profiles upserted.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
