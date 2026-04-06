/**
 * Optional demo supply for growth QA — does not fabricate analytics rows.
 * Usage: GROWTH_SEED_OK=1 npx tsx scripts/growth-seed.ts
 *
 * Creates draft STR listings for GROWTH_SEED_OWNER_EMAIL (must exist) when tables are empty for that owner.
 */
import { prisma } from "@/lib/db";
import { createListing } from "@/lib/bnhub/listings";

async function main() {
  if (process.env.GROWTH_SEED_OK !== "1") {
    console.error("Refusing to run: set GROWTH_SEED_OK=1 to acknowledge demo seeding.");
    process.exit(1);
  }

  const email = process.env.GROWTH_SEED_OWNER_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.error("Set GROWTH_SEED_OWNER_EMAIL to an existing user.");
    process.exit(1);
  }

  const owner = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!owner) {
    console.error(`No user for email ${email}`);
    process.exit(1);
  }

  const existing = await prisma.shortTermListing.count({ where: { ownerId: owner.id } });
  if (existing > 0) {
    console.log(`Owner already has ${existing} listing(s); skip create.`);
    process.exit(0);
  }

  const demos = [
    {
      title: "Bright downtown stay — growth demo",
      city: "Montreal",
      region: "QC",
      country: "CA",
      address: "1 Demo Street",
      nightPriceCents: 12_000,
      maxGuests: 4,
      beds: 2,
      bedrooms: 1,
      baths: 1,
      propertyType: "Apartment",
      roomType: "Entire place",
      category: "bnb",
      photos: [] as string[],
      listingStatus: "DRAFT" as const,
    },
    {
      title: "Quiet loft near transit — growth demo",
      city: "Toronto",
      region: "ON",
      country: "CA",
      address: "2 Sample Ave",
      nightPriceCents: 15_500,
      maxGuests: 3,
      beds: 1,
      bedrooms: 1,
      baths: 1,
      propertyType: "Loft",
      roomType: "Entire place",
      category: "bnb",
      photos: [] as string[],
      listingStatus: "DRAFT" as const,
    },
  ];

  for (const d of demos) {
    try {
      const row = await createListing({
        ownerId: owner.id,
        title: d.title,
        city: d.city,
        region: d.region,
        country: d.country,
        address: d.address,
        nightPriceCents: d.nightPriceCents,
        maxGuests: d.maxGuests,
        beds: d.beds,
        bedrooms: d.bedrooms,
        baths: d.baths,
        propertyType: d.propertyType,
        roomType: d.roomType,
        category: d.category,
        photos: d.photos,
        listingStatus: d.listingStatus,
        description:
          "Demo listing created by growth-seed for funnel testing. Replace copy and photos before publishing.",
      });
      console.log("Created listing", row.id, row.listingCode);
    } catch (e) {
      console.warn("Skip listing (host agreement or validation):", e instanceof Error ? e.message : e);
    }
  }

  console.log("Done. Publish via host tools when ready — events fire on real user actions only.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
