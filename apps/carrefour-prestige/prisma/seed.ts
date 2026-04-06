import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@carrefour-prestige.local" },
    update: {},
    create: {
      email: "admin@carrefour-prestige.local",
      role: "ADMIN",
    },
  });
  await prisma.profile.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@carrefour-prestige.local" },
    update: {},
    create: {
      email: "seller@carrefour-prestige.local",
      role: "SELLER",
    },
  });
  await prisma.profile.upsert({
    where: { userId: seller.id },
    update: {},
    create: { userId: seller.id, firstName: "Demo", lastName: "Seller" },
  });

  await prisma.property.createMany({
    data: [
      {
        title: "Penthouse — Golden Mile",
        description:
          "Panoramic views, private elevator, curated finishes. Template listing for demos.",
        price: 2_450_000,
        city: "Montreal",
        address: "1000 Sherbrooke St W",
        propertyType: "CONDO",
        bedrooms: 3,
        bathrooms: 3.5,
        areaSqm: 220,
        status: "ACTIVE",
        ownerId: seller.id,
      },
      {
        title: "Waterfront estate — Laval",
        description: "Large lot, mature trees, dock access (illustrative).",
        price: 3_200_000,
        city: "Laval",
        address: "2000 Lakeshore Rd",
        propertyType: "HOUSE",
        bedrooms: 5,
        bathrooms: 4,
        areaSqm: 450,
        status: "ACTIVE",
        ownerId: seller.id,
      },
    ],
  });

  console.log("Seed OK — admin id:", admin.id, "seller id:", seller.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
