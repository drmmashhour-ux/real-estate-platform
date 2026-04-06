/**
 * End-to-end demo seed: published BNHub stays (Prisma → `bnhub_listings`), photos,
 * optional insurance partner + sample lead. Idempotent via fixed row ids.
 *
 * Database: set `DATABASE_URL` to your Postgres URL (Supabase: Project Settings → Database → URI).
 * Prisma talks to Postgres directly (bypasses Supabase RLS). This is the supported path.
 *
 * Optional: `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — verifies REST can read `bnhub_listings`
 * (does not insert via REST; no secrets are hard-coded).
 *
 * Clear previous demo rows (titles tagged below) then re-seed:
 *   DEMO_SEED_CLEAR=1 pnpm seed:demo
 */
import path from "node:path";
import { config } from "dotenv";
import {
  InsuranceLeadSource,
  InsuranceLeadStatus,
  InsuranceLeadType,
  ListingAuthorityType,
  ListingStatus,
  ListingVerificationStatus,
  PlatformRole,
  Prisma,
  VerificationStatus,
} from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { allocateUniqueLSTListingCode } from "../lib/listing-code";
import { LEGAL_RENT_RIGHT_ATTESTATION_VERSION } from "../lib/bnhub/legal-rent-attestation-policy";
import { INSURANCE_LEAD_CONSENT_TEXT } from "../lib/insurance/consent-text";
import { prisma } from "../lib/db";

config({ path: path.join(__dirname, "../.env") });

const DEMO_TITLE_TAG = "| LECIPM-E2E-DEMO";

const DEMO_HOST_ID = "a0000001-0001-4001-8001-000000000001";
const DEMO_HOST_EMAIL = "demo-platform-host@lecipm.local";

const DEMO_INSURANCE_PARTNER_ID = "demo_insurance_partner_e2e";
const DEMO_INSURANCE_LEAD_ID = "demo_insurance_lead_e2e";

/** Fixed UUIDs for listings (stable upserts). */
const DEMO_LISTING_IDS = [
  "b0000001-0001-4001-8001-000000000001",
  "b0000001-0001-4001-8001-000000000002",
  "b0000001-0001-4001-8001-000000000003",
  "b0000001-0001-4001-8001-000000000004",
  "b0000001-0001-4001-8001-000000000005",
  "b0000001-0001-4001-8001-000000000006",
  "b0000001-0001-4001-8001-000000000007",
  "b0000001-0001-4001-8001-000000000008",
  "b0000001-0001-4001-8001-000000000009",
  "b0000001-0001-4001-8001-00000000000a",
] as const;

type DemoListingSpec = {
  id: (typeof DEMO_LISTING_IDS)[number];
  title: string;
  description: string;
  city: string;
  region: string;
  country: string;
  address: string;
  nightUsdOrCad: number;
  currency: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  lat: number;
  lng: number;
  propertyType: string;
  roomType: string;
  amenities: string[];
};

const UNSPLASH = {
  living1: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
  living2: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80",
  kitchen: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1200&q=80",
  bedroom: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=80",
  bath: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1200&q=80",
  view: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
  waterfront: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80",
  cozy: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
  loft: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80",
  miami: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
};

const LISTING_SPECS: DemoListingSpec[] = [
  {
    id: DEMO_LISTING_IDS[0],
    title: `Modern Downtown Montreal Condo ${DEMO_TITLE_TAG}`,
    description:
      "Sunny corner unit steps from the Quartier des spectacles. Workspace, full kitchen, and fast Wi‑Fi.",
    city: "Montréal",
    region: "QC",
    country: "CA",
    address: "1200 Rue Demo, Montréal, QC",
    nightUsdOrCad: 189,
    currency: "CAD",
    maxGuests: 4,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    lat: 45.5088,
    lng: -73.5673,
    propertyType: "Apartment",
    roomType: "Entire place",
    amenities: ["WiFi", "Kitchen", "Air conditioning", "Workspace", "Elevator"],
  },
  {
    id: DEMO_LISTING_IDS[1],
    title: `Luxury Waterfront Villa Miami ${DEMO_TITLE_TAG}`,
    description: "Private pool, dock access, and sunset views. Ideal for families or small groups.",
    city: "Miami",
    region: "FL",
    country: "US",
    address: "88 Bay Demo Dr, Miami Beach, FL",
    nightUsdOrCad: 450,
    currency: "USD",
    maxGuests: 8,
    bedrooms: 4,
    beds: 5,
    baths: 3.5,
    lat: 25.7907,
    lng: -80.13,
    propertyType: "Villa",
    roomType: "Entire place",
    amenities: ["WiFi", "Kitchen", "Air conditioning", "Pool", "Parking", "Waterfront"],
  },
  {
    id: DEMO_LISTING_IDS[2],
    title: `Cozy Airbnb in Laval ${DEMO_TITLE_TAG}`,
    description: "Quiet residential street, parking included, 25 min to downtown Montréal.",
    city: "Laval",
    region: "QC",
    country: "CA",
    address: "450 Rue Demo, Laval, QC",
    nightUsdOrCad: 112,
    currency: "CAD",
    maxGuests: 3,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    lat: 45.6066,
    lng: -73.7128,
    propertyType: "House",
    roomType: "Entire place",
    amenities: ["WiFi", "Kitchen", "Parking", "Pets allowed"],
  },
  {
    id: DEMO_LISTING_IDS[3],
    title: `Toronto City View Apartment ${DEMO_TITLE_TAG}`,
    description: "Floor-to-ceiling windows, CN Tower glimpses, gym in building.",
    city: "Toronto",
    region: "ON",
    country: "CA",
    address: "220 Demo St, Toronto, ON",
    nightUsdOrCad: 225,
    currency: "CAD",
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    lat: 43.6532,
    lng: -79.3832,
    propertyType: "Apartment",
    roomType: "Entire place",
    amenities: ["WiFi", "Kitchen", "Air conditioning", "Gym", "Concierge"],
  },
  {
    id: DEMO_LISTING_IDS[4],
    title: `Brooklyn Brownstone Guest Suite ${DEMO_TITLE_TAG}`,
    description: "Garden-level suite with private entrance, vintage details, and great coffee shops nearby.",
    city: "New York",
    region: "NY",
    country: "US",
    address: "150 Demo Ave, Brooklyn, NY",
    nightUsdOrCad: 195,
    currency: "USD",
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    lat: 40.6782,
    lng: -73.9442,
    propertyType: "Townhouse",
    roomType: "Private room",
    amenities: ["WiFi", "Kitchen", "Heating", "Washer"],
  },
  {
    id: DEMO_LISTING_IDS[5],
    title: `Lakefront Cabin Mont-Tremblant ${DEMO_TITLE_TAG}`,
    description: "Wood stove, canoe, and starry nights — perfect après-ski or summer lake days.",
    city: "Mont-Tremblant",
    region: "QC",
    country: "CA",
    address: "8 Chemin Demo, Mont-Tremblant, QC",
    nightUsdOrCad: 265,
    currency: "CAD",
    maxGuests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 2,
    lat: 46.1184,
    lng: -74.5962,
    propertyType: "Cabin",
    roomType: "Entire place",
    amenities: ["WiFi", "Kitchen", "Fireplace", "Parking", "Ski storage"],
  },
  {
    id: DEMO_LISTING_IDS[6],
    title: `Austin Live Music Loft ${DEMO_TITLE_TAG}`,
    description: "Walk to Rainey Street; record-inspired décor and a stocked kitchen for late-night tacos.",
    city: "Austin",
    region: "TX",
    country: "US",
    address: "90 Demo Blvd, Austin, TX",
    nightUsdOrCad: 142,
    currency: "USD",
    maxGuests: 4,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    lat: 30.2672,
    lng: -97.7431,
    propertyType: "Loft",
    roomType: "Entire place",
    amenities: ["WiFi", "Kitchen", "Air conditioning", "Rooftop access"],
  },
  {
    id: DEMO_LISTING_IDS[7],
    title: `Vancouver Seawall Studio ${DEMO_TITLE_TAG}`,
    description: "Compact studio with bike storage, minutes from the seawall and Stanley Park.",
    city: "Vancouver",
    region: "BC",
    country: "CA",
    address: "500 Demo Rd, Vancouver, BC",
    nightUsdOrCad: 155,
    currency: "CAD",
    maxGuests: 2,
    bedrooms: 0,
    beds: 1,
    baths: 1,
    lat: 49.2827,
    lng: -123.1207,
    propertyType: "Apartment",
    roomType: "Entire place",
    amenities: ["WiFi", "Kitchen", "Air conditioning", "Bike storage"],
  },
  {
    id: DEMO_LISTING_IDS[8],
    title: `Nashville Songwriter Cottage ${DEMO_TITLE_TAG}`,
    description: "Porch swing, vinyl corner, and a short ride to Broadway.",
    city: "Nashville",
    region: "TN",
    country: "US",
    address: "12 Demo Ln, Nashville, TN",
    nightUsdOrCad: 128,
    currency: "USD",
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    lat: 36.1627,
    lng: -86.7816,
    propertyType: "House",
    roomType: "Entire place",
    amenities: ["WiFi", "Kitchen", "Parking", "Patio"],
  },
  {
    id: DEMO_LISTING_IDS[9],
    title: `Halifax Harbour Penthouse ${DEMO_TITLE_TAG}`,
    description: "Two-level penthouse with harbour views, ideal for remote work + weekend sailing.",
    city: "Halifax",
    region: "NS",
    country: "CA",
    address: "9 Demo Wharf, Halifax, NS",
    nightUsdOrCad: 310,
    currency: "CAD",
    maxGuests: 5,
    bedrooms: 2,
    beds: 3,
    baths: 2,
    lat: 44.6488,
    lng: -63.5752,
    propertyType: "Apartment",
    roomType: "Entire place",
    amenities: ["WiFi", "Kitchen", "Air conditioning", "Parking", "Waterfront"],
  },
];

function photoSetForIndex(i: number): string[] {
  const sets = [
    [UNSPLASH.living1, UNSPLASH.kitchen, UNSPLASH.bedroom, UNSPLASH.bath],
    [UNSPLASH.miami, UNSPLASH.waterfront, UNSPLASH.kitchen, UNSPLASH.bedroom],
    [UNSPLASH.cozy, UNSPLASH.living2, UNSPLASH.kitchen, UNSPLASH.bath],
    [UNSPLASH.view, UNSPLASH.loft, UNSPLASH.kitchen, UNSPLASH.bedroom],
    [UNSPLASH.living2, UNSPLASH.bedroom, UNSPLASH.kitchen, UNSPLASH.bath],
    [UNSPLASH.waterfront, UNSPLASH.living1, UNSPLASH.kitchen, UNSPLASH.bedroom],
    [UNSPLASH.loft, UNSPLASH.living2, UNSPLASH.kitchen, UNSPLASH.bath],
    [UNSPLASH.view, UNSPLASH.cozy, UNSPLASH.kitchen, UNSPLASH.bedroom],
    [UNSPLASH.cozy, UNSPLASH.living1, UNSPLASH.kitchen, UNSPLASH.bath],
    [UNSPLASH.waterfront, UNSPLASH.view, UNSPLASH.kitchen, UNSPLASH.bedroom],
  ];
  return sets[i % sets.length];
}

async function pingSupabaseServiceRole(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.log(
      "Supabase REST: skipped (set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to verify)."
    );
    return;
  }
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await sb.from("bnhub_listings").select("id").limit(1);
  if (error) {
    console.warn("Supabase service role ping failed (REST):", error.message);
  } else {
    console.log("Supabase service role: OK — `bnhub_listings` readable via REST.");
  }
}

async function clearPriorDemoRows(): Promise<void> {
  const existing = await prisma.shortTermListing.findMany({
    where: { title: { contains: DEMO_TITLE_TAG } },
    select: { id: true },
  });
  const listingIds = existing.map((r) => r.id);
  if (listingIds.length === 0) {
    console.log("Demo clear: no tagged listings to remove.");
    return;
  }
  const leads = await prisma.insuranceLead.findMany({
    where: { listingId: { in: listingIds } },
    select: { id: true },
  });
  const leadIds = leads.map((l) => l.id);
  if (leadIds.length) {
    await prisma.insuranceLeadFunnelEvent.deleteMany({ where: { leadId: { in: leadIds } } });
    await prisma.insuranceLead.deleteMany({ where: { id: { in: leadIds } } });
  }
  const deleted = await prisma.shortTermListing.deleteMany({ where: { id: { in: listingIds } } });
  console.log(`Demo clear: removed ${deleted.count} short-term listing(s) tagged for E2E demo.`);
}

async function seedHost(): Promise<void> {
  await prisma.user.upsert({
    where: { id: DEMO_HOST_ID },
    create: {
      id: DEMO_HOST_ID,
      email: DEMO_HOST_EMAIL,
      name: "Platform Demo Host",
      role: PlatformRole.HOST,
      accountStatus: "ACTIVE",
    },
    update: {
      email: DEMO_HOST_EMAIL,
      name: "Platform Demo Host",
      role: PlatformRole.HOST,
      accountStatus: "ACTIVE",
    },
  });
}

async function seedInsuranceLayer(firstListingId: string): Promise<void> {
  await prisma.insurancePartner.upsert({
    where: { id: DEMO_INSURANCE_PARTNER_ID },
    create: {
      id: DEMO_INSURANCE_PARTNER_ID,
      name: "Demo Insurance Partner (E2E)",
      contactEmail: "insurance-partner-demo@lecipm.local",
      fixedPricePerLead: new Prisma.Decimal("25.00"),
      basePricePerLead: new Prisma.Decimal("25.00"),
      bonusHighQualityLead: new Prisma.Decimal("10.00"),
      preferredLeadTypes: ["TRAVEL", "PROPERTY", "MORTGAGE"],
      isActive: true,
    },
    update: {
      name: "Demo Insurance Partner (E2E)",
      contactEmail: "insurance-partner-demo@lecipm.local",
      isActive: true,
    },
  });

  await prisma.insuranceLead.upsert({
    where: { id: DEMO_INSURANCE_LEAD_ID },
    create: {
      id: DEMO_INSURANCE_LEAD_ID,
      email: "e2e-insurance-sample@lecipm.demo",
      fullName: "Alex Demo",
      phone: "+15145550199",
      leadType: InsuranceLeadType.TRAVEL,
      source: InsuranceLeadSource.BNBHUB,
      listingId: firstListingId,
      consentGiven: true,
      consentText: INSURANCE_LEAD_CONSENT_TEXT,
      status: InsuranceLeadStatus.NEW,
      partnerId: DEMO_INSURANCE_PARTNER_ID,
      leadScore: 42,
      variantId: "A",
      message: "Sample lead for admin testing — submitted via demo seed.",
    },
    update: {
      listingId: firstListingId,
      partnerId: DEMO_INSURANCE_PARTNER_ID,
      status: InsuranceLeadStatus.NEW,
    },
  });
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required (Postgres connection string, e.g. from Supabase).");
    process.exit(1);
  }

  await pingSupabaseServiceRole();

  if (process.env.DEMO_SEED_CLEAR === "1") {
    await clearPriorDemoRows();
  }

  await seedHost();

  await primeSeenListings();

  let inserted = 0;
  for (let i = 0; i < LISTING_SPECS.length; i++) {
    const spec = LISTING_SPECS[i];
    const nightPriceCents = Math.round(spec.nightUsdOrCad * 100);
    const photoUrls = photoSetForIndex(i);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.shortTermListing.findUnique({
        where: { id: spec.id },
        select: { listingCode: true },
      });
      const listingCode = existing?.listingCode ?? (await allocateUniqueLSTListingCode(tx));

      await tx.shortTermListing.upsert({
        where: { id: spec.id },
        create: {
          id: spec.id,
          listingCode,
          title: spec.title,
          description: spec.description,
          propertyType: spec.propertyType,
          roomType: spec.roomType,
          category: "Vacation rental",
          address: spec.address,
          city: spec.city,
          region: spec.region,
          country: spec.country,
          latitude: spec.lat,
          longitude: spec.lng,
          nightPriceCents,
          currency: spec.currency,
          maxGuests: spec.maxGuests,
          bedrooms: spec.bedrooms,
          beds: spec.beds,
          baths: spec.baths,
          photos: photoUrls,
          amenities: spec.amenities,
          instantBookEnabled: true,
          minStayNights: 1,
          listingStatus: ListingStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VERIFIED,
          listingVerificationStatus: ListingVerificationStatus.VERIFIED,
          listingAuthorityType: ListingAuthorityType.OWNER,
          legalRentRightAttestedAt: new Date(),
          legalRentRightAttestationVersion: LEGAL_RENT_RIGHT_ATTESTATION_VERSION,
          ownerId: DEMO_HOST_ID,
        },
        update: {
          title: spec.title,
          description: spec.description,
          propertyType: spec.propertyType,
          roomType: spec.roomType,
          address: spec.address,
          city: spec.city,
          region: spec.region,
          country: spec.country,
          latitude: spec.lat,
          longitude: spec.lng,
          nightPriceCents,
          currency: spec.currency,
          maxGuests: spec.maxGuests,
          bedrooms: spec.bedrooms,
          beds: spec.beds,
          baths: spec.baths,
          photos: photoUrls,
          amenities: spec.amenities,
          instantBookEnabled: true,
          listingStatus: ListingStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VERIFIED,
          listingVerificationStatus: ListingVerificationStatus.VERIFIED,
          legalRentRightAttestedAt: new Date(),
          legalRentRightAttestationVersion: LEGAL_RENT_RIGHT_ATTESTATION_VERSION,
        },
      });
    });

    await prisma.bnhubListingPhoto.deleteMany({ where: { listingId: spec.id } });
    await prisma.bnhubListingPhoto.createMany({
      data: photoUrls.map((url, idx) => ({
        listingId: spec.id,
        url,
        sortOrder: idx,
        isCover: idx === 0,
      })),
    });

    if (!existingListingBeforeRun(spec.id)) inserted++;
  }

  await seedInsuranceLayer(DEMO_LISTING_IDS[0]);

  const publishedDemoCount = await prisma.shortTermListing.count({
    where: { listingStatus: ListingStatus.PUBLISHED, title: { contains: DEMO_TITLE_TAG } },
  });
  const publishedAny = await prisma.shortTermListing.count({
    where: { listingStatus: ListingStatus.PUBLISHED },
  });

  console.log("—".repeat(60));
  console.log(`Demo seed complete. Tagged published listings: ${publishedDemoCount}`);
  console.log(`Total published BNHub listings in DB: ${publishedAny}`);
  console.log(
    `Upsert path: ${inserted} listing(s) were new in this process; all ${LISTING_SPECS.length} rows are up to date.`
  );
  console.log("Insurance: partner + sample lead ready for /admin/insurance and capture forms.");
  console.log("—".repeat(60));
}

/** Tracks listing ids that already existed before this run (for insert count). */
const seenAtStart = new Set<string>();
async function primeSeenListings(): Promise<void> {
  seenAtStart.clear();
  const rows = await prisma.shortTermListing.findMany({
    where: { id: { in: [...DEMO_LISTING_IDS] } },
    select: { id: true },
  });
  for (const r of rows) seenAtStart.add(r.id);
}
function existingListingBeforeRun(id: string): boolean {
  return seenAtStart.has(id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
