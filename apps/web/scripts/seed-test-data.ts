/**
 * Seed deterministic users + listings for safe E2E (use with NEXT_PUBLIC_APP_MODE=test + Stripe test keys).
 *
 * Run from `apps/web`:
 *   pnpm run seed:test
 *
 * Logins (scrypt password hash):
 *   admin@test.com   / TestMode2026!
 *   host@test.com    / TestMode2026!
 *   broker@test.com  / TestMode2026!
 *   user@test.com    / TestMode2026!
 */

import {
  PrismaClient,
  type FsboListingOwnerType,
  ListingAcquisitionSourceType,
  ListingAcquisitionPermissionStatus,
  ListingAcquisitionIntakeStatus,
} from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

const PHOTO =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";

const IDS = {
  admin: "e2e11111111-1111-4111-8111-111111111101",
  host: "e2e11111111-1111-4111-8111-111111111102",
  broker: "e2e11111111-1111-4111-8111-111111111103",
  user: "e2e11111111-1111-4111-8111-111111111104",
} as const;

const exp = new Date();
exp.setFullYear(exp.getFullYear() + 1);

async function upsertUsers(pwHash: string) {
  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {
      passwordHash: pwHash,
      role: "ADMIN",
      accountStatus: "ACTIVE",
      emailVerifiedAt: new Date(),
      name: "E2E Admin",
    },
    create: {
      id: IDS.admin,
      email: "admin@test.com",
      passwordHash: pwHash,
      role: "ADMIN",
      accountStatus: "ACTIVE",
      emailVerifiedAt: new Date(),
      name: "E2E Admin",
    },
  });

  await prisma.user.upsert({
    where: { email: "host@test.com" },
    update: {
      passwordHash: pwHash,
      role: "HOST",
      accountStatus: "ACTIVE",
      emailVerifiedAt: new Date(),
      name: "E2E Host",
      marketplacePersona: "UNSET",
    },
    create: {
      id: IDS.host,
      email: "host@test.com",
      passwordHash: pwHash,
      role: "HOST",
      accountStatus: "ACTIVE",
      emailVerifiedAt: new Date(),
      name: "E2E Host",
      marketplacePersona: "UNSET",
    },
  });

  await prisma.user.upsert({
    where: { email: "broker@test.com" },
    update: {
      passwordHash: pwHash,
      role: "BROKER",
      brokerStatus: "VERIFIED",
      accountStatus: "ACTIVE",
      emailVerifiedAt: new Date(),
      name: "E2E Broker",
      marketplacePersona: "BROKER",
    },
    create: {
      id: IDS.broker,
      email: "broker@test.com",
      passwordHash: pwHash,
      role: "BROKER",
      brokerStatus: "VERIFIED",
      accountStatus: "ACTIVE",
      emailVerifiedAt: new Date(),
      name: "E2E Broker",
      marketplacePersona: "BROKER",
    },
  });

  await prisma.user.upsert({
    where: { email: "user@test.com" },
    update: {
      passwordHash: pwHash,
      role: "USER",
      accountStatus: "ACTIVE",
      emailVerifiedAt: new Date(),
      name: "E2E Guest Buyer",
    },
    create: {
      id: IDS.user,
      email: "user@test.com",
      passwordHash: pwHash,
      role: "USER",
      accountStatus: "ACTIVE",
      emailVerifiedAt: new Date(),
      name: "E2E Guest Buyer",
    },
  });
}

async function seedFsbo() {
  const rows: {
    id: string;
    code: string;
    title: string;
    city: string;
    priceCents: number;
    beds: number;
    baths: number;
    sqft: number;
    owner: "user" | "broker";
    ownerType: FsboListingOwnerType;
  }[] = [
    {
      id: "e2e22222222-2222-4222-8222-222222222201",
      code: "LST-E2E000001",
      title: "E2E — Bright condo in Montreal",
      city: "Montreal",
      priceCents: 489_900_00,
      beds: 2,
      baths: 2,
      sqft: 980,
      owner: "user",
      ownerType: "SELLER",
    },
    {
      id: "e2e22222222-2222-4222-8222-222222222202",
      code: "LST-E2E000002",
      title: "E2E — Quebec City rowhouse",
      city: "Quebec City",
      priceCents: 379_000_00,
      beds: 3,
      baths: 1,
      sqft: 1250,
      owner: "user",
      ownerType: "SELLER",
    },
    {
      id: "e2e22222222-2222-4222-8222-222222222203",
      code: "LST-E2E000003",
      title: "E2E — Laval family home",
      city: "Laval",
      priceCents: 629_900_00,
      beds: 4,
      baths: 2,
      sqft: 1850,
      owner: "user",
      ownerType: "SELLER",
    },
    {
      id: "e2e22222222-2222-4222-8222-222222222204",
      code: "LST-E2E000004",
      title: "E2E — Montreal starter duplex",
      city: "Montreal",
      priceCents: 525_000_00,
      beds: 3,
      baths: 2,
      sqft: 1400,
      owner: "user",
      ownerType: "SELLER",
    },
    {
      id: "e2e22222222-2222-4222-8222-222222222205",
      code: "LST-E2E000005",
      title: "E2E — Broker co-listed Montreal loft",
      city: "Montreal",
      priceCents: 415_000_00,
      beds: 1,
      baths: 1,
      sqft: 720,
      owner: "broker",
      ownerType: "BROKER",
    },
    {
      id: "e2e22222222-2222-4222-8222-222222222206",
      code: "LST-E2E000006",
      title: "E2E — Broker Laval bungalow",
      city: "Laval",
      priceCents: 559_000_00,
      beds: 3,
      baths: 2,
      sqft: 1600,
      owner: "broker",
      ownerType: "BROKER",
    },
    {
      id: "e2e22222222-2222-4222-8222-222222222207",
      code: "LST-E2E000007",
      title: "E2E — Broker QC investment triplex",
      city: "Quebec City",
      priceCents: 699_000_00,
      beds: 6,
      baths: 3,
      sqft: 2400,
      owner: "broker",
      ownerType: "BROKER",
    },
    {
      id: "e2e22222222-2222-4222-8222-222222222208",
      code: "LST-E2E000008",
      title: "E2E — Seller Montreal townhouse",
      city: "Montreal",
      priceCents: 598_500_00,
      beds: 3,
      baths: 3,
      sqft: 1650,
      owner: "user",
      ownerType: "SELLER",
    },
  ];

  for (const r of rows) {
    const ownerId = r.owner === "broker" ? IDS.broker : IDS.user;
    await prisma.fsboListing.upsert({
      where: { id: r.id },
      update: {
        title: r.title,
        description: `E2E seed listing in ${r.city}. Safe test copy — not a real offer. Beds ${r.beds}, baths ${r.baths}, ~${r.sqft} sq ft.`,
        priceCents: r.priceCents,
        address: `${100 + rows.indexOf(r)} E2E Test Street`,
        city: r.city,
        country: "CA",
        region: "QC",
        bedrooms: r.beds,
        bathrooms: r.baths,
        surfaceSqft: r.sqft,
        images: [PHOTO],
        coverImage: PHOTO,
        status: "ACTIVE",
        moderationStatus: "APPROVED",
        contactEmail: "e2e-seller@example.invalid",
        contactPhone: "+15145550100",
        listingOwnerType: r.ownerType,
        listingCode: r.code,
        expiresAt: exp,
        photoConfirmationAcceptedAt: new Date(),
        propertyType: "SINGLE_FAMILY",
      },
      create: {
        id: r.id,
        ownerId,
        title: r.title,
        description: `E2E seed listing in ${r.city}. Safe test copy — not a real offer. Beds ${r.beds}, baths ${r.baths}, ~${r.sqft} sq ft.`,
        priceCents: r.priceCents,
        address: `${100 + rows.indexOf(r)} E2E Test Street`,
        city: r.city,
        country: "CA",
        region: "QC",
        bedrooms: r.beds,
        bathrooms: r.baths,
        surfaceSqft: r.sqft,
        images: [PHOTO],
        coverImage: PHOTO,
        status: "ACTIVE",
        moderationStatus: "APPROVED",
        contactEmail: "e2e-seller@example.invalid",
        contactPhone: "+15145550100",
        listingOwnerType: r.ownerType,
        listingCode: r.code,
        expiresAt: exp,
        photoConfirmationAcceptedAt: new Date(),
        propertyType: "SINGLE_FAMILY",
      },
    });
  }
}

async function seedCrmListings() {
  const crm = [
    { id: "e2e33333333-3333-4333-8333-333333333301", code: "LST-E2E010001", title: "E2E CRM — Montreal penthouse", price: 899_000, city: "Montreal" },
    { id: "e2e33333333-3333-4333-8333-333333333302", code: "LST-E2E010002", title: "E2E CRM — QC cottage", price: 425_000, city: "Quebec City" },
    { id: "e2e33333333-3333-4333-8333-333333333303", code: "LST-E2E010003", title: "E2E CRM — Laval condo", price: 310_000, city: "Laval" },
    { id: "e2e33333333-3333-4333-8333-333333333304", code: "LST-E2E010004", title: "E2E CRM — MTL workspace", price: 199_000, city: "Montreal" },
  ];
  for (const c of crm) {
    await prisma.listing.upsert({
      where: { id: c.id },
      update: { title: c.title, price: c.price, ownerId: IDS.broker },
      create: {
        id: c.id,
        listingCode: c.code,
        title: c.title,
        price: c.price,
        ownerId: IDS.broker,
      },
    });
    await prisma.brokerListingAccess.upsert({
      where: { listingId_brokerId: { listingId: c.id, brokerId: IDS.broker } },
      update: {},
      create: { listingId: c.id, brokerId: IDS.broker, role: "owner" },
    });
  }
}

async function seedStays() {
  const stays: {
    id: string;
    code: string;
    title: string;
    city: string;
    night: number;
    beds: number;
    baths: number;
  }[] = [
    { id: "e2e44444444-4444-4444-8444-444444444401", code: "LST-E2E020001", title: "E2E Stay — Old Montreal loft", city: "Montreal", night: 12_500, beds: 2, baths: 1 },
    { id: "e2e44444444-4444-4444-8444-444444444402", code: "LST-E2E020002", title: "E2E Stay — QC riverside cabin", city: "Quebec City", night: 9_800, beds: 3, baths: 2 },
    { id: "e2e44444444-4444-4444-8444-444444444403", code: "LST-E2E020003", title: "E2E Stay — Laval quiet suite", city: "Laval", night: 8_200, beds: 1, baths: 1 },
    { id: "e2e44444444-4444-4444-8444-444444444404", code: "LST-E2E020004", title: "E2E Stay — Downtown MTL studio", city: "Montreal", night: 7_500, beds: 1, baths: 1 },
    { id: "e2e44444444-4444-4444-8444-444444444405", code: "LST-E2E020005", title: "E2E Stay — Family QC home", city: "Quebec City", night: 11_200, beds: 4, baths: 2 },
    { id: "e2e44444444-4444-4444-8444-444444444406", code: "LST-E2E020006", title: "E2E Stay — MTL garden flat", city: "Montreal", night: 10_400, beds: 2, baths: 2 },
  ];

  for (const s of stays) {
    await prisma.shortTermListing.upsert({
      where: { id: s.id },
      update: {
        title: s.title,
        description: `E2E BNHub seed stay in ${s.city}. Test-only description.`,
        address: `${200 + stays.indexOf(s)} E2E Stay Ave`,
        city: s.city,
        country: "CA",
        region: "QC",
        nightPriceCents: s.night,
        currency: "CAD",
        beds: s.beds,
        baths: s.baths,
        maxGuests: Math.min(6, s.beds + 2),
        photos: [PHOTO] as unknown as string[],
        listingStatus: "PUBLISHED",
        verificationStatus: "VERIFIED",
        instantBookEnabled: true,
        listingCode: s.code,
        propertyType: "Apartment",
        roomType: "Entire place",
      },
      create: {
        id: s.id,
        ownerId: IDS.host,
        listingCode: s.code,
        title: s.title,
        subtitle: "E2E test stay",
        description: `E2E BNHub seed stay in ${s.city}. Test-only description.`,
        address: `${200 + stays.indexOf(s)} E2E Stay Ave`,
        city: s.city,
        country: "CA",
        region: "QC",
        nightPriceCents: s.night,
        currency: "CAD",
        beds: s.beds,
        baths: s.baths,
        maxGuests: Math.min(6, s.beds + 2),
        photos: [PHOTO] as unknown as string[],
        listingStatus: "PUBLISHED",
        verificationStatus: "VERIFIED",
        instantBookEnabled: true,
        propertyType: "Apartment",
        roomType: "Entire place",
      },
    });
  }
}

async function seedAcquisitionPipeline() {
  const descBase =
    "E2E supply seed — original test copy only. Not copied from any third-party listing. For pipeline review drills.";

  await prisma.listingAcquisitionLead.upsert({
    where: { id: "e2e-acq-00000001-0001-4001-8001-000000000001" },
    update: {},
    create: {
      id: "e2e-acq-00000001-0001-4001-8001-000000000001",
      sourceType: ListingAcquisitionSourceType.OWNER,
      contactName: "E2E Owner Lead",
      contactEmail: "owner-lead@test.com",
      contactPhone: "+15145550201",
      city: "Montreal",
      propertyCategory: "Condo",
      sourcePlatformText: "Inbound test — not from a portal scrape",
      permissionStatus: ListingAcquisitionPermissionStatus.REQUESTED,
      intakeStatus: ListingAcquisitionIntakeStatus.NEW,
      notes: "Test acquisition row — safe seed only",
      description: descBase,
      priceCents: 399_000_00,
      bedrooms: 2,
      bathrooms: 1,
    },
  });

  await prisma.listingAcquisitionLead.upsert({
    where: { id: "e2e-acq-00000001-0001-4001-8001-000000000002" },
    update: {},
    create: {
      id: "e2e-acq-00000001-0001-4001-8001-000000000002",
      sourceType: ListingAcquisitionSourceType.BROKER,
      contactName: "E2E Broker Lead",
      contactEmail: "broker-lead@test.com",
      city: "Laval",
      propertyCategory: "Single-family",
      permissionStatus: ListingAcquisitionPermissionStatus.GRANTED,
      intakeStatus: ListingAcquisitionIntakeStatus.CONTACTED,
      notes: "Broker-attested test data",
      description: descBase,
      permissionConfirmedAt: new Date(),
    },
  });

  await prisma.listingAcquisitionLead.upsert({
    where: { id: "e2e-acq-00000001-0001-4001-8001-000000000003" },
    update: {},
    create: {
      id: "e2e-acq-00000001-0001-4001-8001-000000000003",
      sourceType: ListingAcquisitionSourceType.HOST,
      contactName: "E2E Host Lead",
      contactEmail: "host-lead@test.com",
      city: "Quebec City",
      propertyCategory: "Short-term rental",
      permissionStatus: ListingAcquisitionPermissionStatus.UNKNOWN,
      intakeStatus: ListingAcquisitionIntakeStatus.AWAITING_ASSETS,
      notes: "Awaiting host photos — placeholder only in test",
      description: descBase,
    },
  });

  await prisma.fsboListing.upsert({
    where: { id: "e2e66666666-6666-4666-8666-666666666601" },
    update: {
      supplyPublicationStage: "draft",
      status: "DRAFT",
      moderationStatus: "PENDING",
      missingApprovedImages: true,
    },
    create: {
      id: "e2e66666666-6666-4666-8666-666666666601",
      ownerId: IDS.user,
      listingCode: "LST-E2E-SUP-DRAFT",
      title: "E2E — Supply draft (not live)",
      description: descBase,
      priceCents: 100,
      address: "Draft — Montreal",
      city: "Montreal",
      country: "CA",
      region: "QC",
      contactEmail: "user@test.com",
      status: "DRAFT",
      moderationStatus: "PENDING",
      supplyPublicationStage: "draft",
      listingOwnerType: "SELLER",
      images: [],
      missingApprovedImages: true,
      rewrittenDescriptionReviewed: false,
      imagesApproved: false,
    },
  });

  await prisma.fsboListing.upsert({
    where: { id: "e2e66666666-6666-4666-8666-666666666602" },
    update: {
      supplyPublicationStage: "pending_review",
      status: "DRAFT",
      moderationStatus: "PENDING",
    },
    create: {
      id: "e2e66666666-6666-4666-8666-666666666602",
      ownerId: IDS.user,
      listingCode: "LST-E2E-SUP-REVIEW",
      title: "E2E — Pending supply review",
      description: descBase,
      priceCents: 200,
      address: "Draft — Laval",
      city: "Laval",
      country: "CA",
      region: "QC",
      contactEmail: "user@test.com",
      status: "DRAFT",
      moderationStatus: "PENDING",
      supplyPublicationStage: "pending_review",
      listingOwnerType: "SELLER",
      images: [PHOTO],
      coverImage: PHOTO,
      missingApprovedImages: false,
      rewrittenDescriptionReviewed: true,
      imagesApproved: false,
    },
  });
}

async function main() {
  console.log("[seed:test] hashing password TestMode2026! …");
  const pwHash = await hashPassword("TestMode2026!");
  await upsertUsers(pwHash);
  console.log("[seed:test] users OK (admin/host/broker/user @test.com)");
  await seedFsbo();
  console.log("[seed:test] 8 FSBO listings OK");
  await seedCrmListings();
  console.log("[seed:test] 4 CRM listings OK");
  await seedStays();
  console.log("[seed:test] 6 BNHub stays OK");
  await seedAcquisitionPipeline();
  console.log("[seed:test] acquisition leads + supply draft/review FSBO OK");
  console.log("\nDone. Set NEXT_PUBLIC_APP_MODE=test and use Stripe test keys for checkout E2E.\n");
}

main()
  .catch((e) => {
    console.error("[seed:test] failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
