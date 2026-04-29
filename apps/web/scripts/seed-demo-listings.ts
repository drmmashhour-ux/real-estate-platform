/**
 * Seed a few ACTIVE FSBO listings for `/en/ca/listings` browse + map (demo/dev).
 *
 * Run from repo root:
 *   pnpm tsx apps/web/scripts/seed-demo-listings.ts
 *
 * From apps/web:
 *   pnpm seed:demo-listings
 *
 * Requires `DATABASE_URL`. Loads `apps/web/.env` + `.env.local` when present.
 *
 * Uses Prisma 7 driver adapter (`@prisma/adapter-pg` + `pg`).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEMO_OWNER_ID = "a0000003-0003-4003-8003-000000000001";
const DEMO_OWNER_EMAIL = "lecipm-demo-listings@lecipm.internal";

const PHOTO_HOUSE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";
const PHOTO_MODERN =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80";
const PHOTO_LUXURY =
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80";

const rows = [
  {
    id: "lecipm-demo-fsbo-mtl-001",
    code: "LST-DEMO0001",
    title: "Demo — Montreal row house",
    city: "Montreal",
    priceCents: 75_000_000,
    beds: 3,
    baths: 2,
    latitude: 45.5017,
    longitude: -73.5673,
    image: PHOTO_HOUSE,
  },
  {
    id: "lecipm-demo-fsbo-lav-002",
    code: "LST-DEMO0002",
    title: "Demo — Laval family home",
    city: "Laval",
    priceCents: 62_000_000,
    beds: 4,
    baths: 2,
    latitude: 45.6066,
    longitude: -73.7124,
    image: PHOTO_MODERN,
  },
  {
    id: "lecipm-demo-fsbo-long-003",
    code: "LST-DEMO0003",
    title: "Demo — Longueuil contemporary",
    city: "Longueuil",
    priceCents: 82_000_000,
    beds: 3,
    baths: 2,
    latitude: 45.5312,
    longitude: -73.5181,
    image: PHOTO_LUXURY,
  },
] as const;

async function main() {
  const { config } = await import("dotenv");
  config({ path: path.join(__dirname, "../.env") });
  config({ path: path.join(__dirname, "../.env.local"), override: true });

  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    throw new Error("DATABASE_URL is missing — set apps/web/.env or .env.local.");
  }

  const { Pool } = await import("pg");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("@prisma/client");

  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const exp = new Date();
  exp.setFullYear(exp.getFullYear() + 1);

  await prisma.user.upsert({
    where: { email: DEMO_OWNER_EMAIL },
    update: { accountStatus: "ACTIVE" },
    create: {
      id: DEMO_OWNER_ID,
      email: DEMO_OWNER_EMAIL,
      name: "LECIPM demo listings owner",
      role: "USER",
      plan: "free",
      accountStatus: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    await prisma.fsboListing.upsert({
      where: { id: r.id },
      update: {
        title: r.title,
        description: `Demo seed listing in ${r.city}. Not a real offer — for UI and map testing only.`,
        priceCents: r.priceCents,
        address: `${50 + i} Demo Seed Street`,
        city: r.city,
        country: "CA",
        region: "QC",
        bedrooms: r.beds,
        bathrooms: r.baths,
        surfaceSqft: 1600,
        images: [r.image],
        coverImage: r.image,
        status: "ACTIVE",
        moderationStatus: "APPROVED",
        contactEmail: "demo-listings@lecipm.internal",
        contactPhone: "+15145550100",
        listingOwnerType: "SELLER",
        listingCode: r.code,
        listingDealType: "SALE",
        expiresAt: exp,
        photoConfirmationAcceptedAt: new Date(),
        propertyType: "SINGLE_FAMILY",
        latitude: r.latitude,
        longitude: r.longitude,
      },
      create: {
        id: r.id,
        ownerId: DEMO_OWNER_ID,
        title: r.title,
        description: `Demo seed listing in ${r.city}. Not a real offer — for UI and map testing only.`,
        priceCents: r.priceCents,
        address: `${50 + i} Demo Seed Street`,
        city: r.city,
        country: "CA",
        region: "QC",
        bedrooms: r.beds,
        bathrooms: r.baths,
        surfaceSqft: 1600,
        images: [r.image],
        coverImage: r.image,
        status: "ACTIVE",
        moderationStatus: "APPROVED",
        contactEmail: "demo-listings@lecipm.internal",
        contactPhone: "+15145550100",
        listingOwnerType: "SELLER",
        listingCode: r.code,
        listingDealType: "SALE",
        expiresAt: exp,
        photoConfirmationAcceptedAt: new Date(),
        propertyType: "SINGLE_FAMILY",
        latitude: r.latitude,
        longitude: r.longitude,
      },
    });
  }

  console.log("Demo listings seeded:", rows.map((x) => x.id).join(", "));

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
