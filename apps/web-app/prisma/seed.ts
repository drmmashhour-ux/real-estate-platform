import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const guest = await prisma.user.upsert({
    where: { email: "guest@demo.com" },
    update: {},
    create: {
      email: "guest@demo.com",
      name: "Demo Guest",
      role: "USER",
    },
  });

  const host = await prisma.user.upsert({
    where: { email: "host@demo.com" },
    update: {},
    create: {
      email: "host@demo.com",
      name: "Demo Host",
      role: "OWNER_HOST",
    },
  });

  const listing = await prisma.shortTermListing.upsert({
    where: { id: "demo-listing-montreal" },
    update: {},
    create: {
      id: "demo-listing-montreal",
      title: "Cozy loft in Old Montreal",
      description: "Walking distance to Notre-Dame, cafés, and the river. Perfect for a short stay.",
      address: "123 Place Jacques-Cartier",
      city: "Montreal",
      country: "CA",
      latitude: 45.5088,
      longitude: -73.5542,
      nightPriceCents: 12500, // $125/night
      beds: 2,
      baths: 1,
      maxGuests: 4,
      photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      ownerId: host.id,
    },
  });

  console.log("Seeded:");
  console.log("  Guest:", guest.id, guest.email, "→ sign in at /bnhub/login");
  console.log("  Host:", host.id, host.email);
  console.log("  BNHub listing:", listing.id, listing.title, "→ /bnhub", listing.city);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
