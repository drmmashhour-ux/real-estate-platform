/**
 * Investor demo mode — minimal deterministic rows for LECIPM + BNHUB demo paths.
 * Run from apps/web: pnpm seed:demo:investor
 *
 * Requires DATABASE_URL and a DB schema in sync with Prisma (run migrations first).
 * Safe to re-run (upserts by fixed ids).
 */
import path from "node:path";
import { config } from "dotenv";
import {
  BookingStatus,
  ListingStatus,
  ListingVerificationStatus,
  PlatformRole,
  VerificationStatus,
} from "@prisma/client";
import { LEGAL_RENT_RIGHT_ATTESTATION_VERSION } from "../lib/bnhub/legal-rent-attestation-policy";
import { prisma } from "../lib/db";
import { INVESTOR_DEMO_IDS } from "../src/modules/demo/demoIds";

config({ path: path.join(__dirname, "../.env") });

const HOST_EMAIL = "investor-demo-host@lecipm.internal";
const GUEST_EMAIL = "investor-demo-guest@lecipm.internal";

async function main() {
  await prisma.user.upsert({
    where: { id: INVESTOR_DEMO_IDS.HOST_USER },
    create: {
      id: INVESTOR_DEMO_IDS.HOST_USER,
      email: HOST_EMAIL,
      name: "Investor Demo Host",
      role: PlatformRole.HOST,
      accountStatus: "ACTIVE",
    },
    update: { email: HOST_EMAIL, name: "Investor Demo Host", role: PlatformRole.HOST },
  });

  await prisma.user.upsert({
    where: { id: INVESTOR_DEMO_IDS.GUEST_USER },
    create: {
      id: INVESTOR_DEMO_IDS.GUEST_USER,
      email: GUEST_EMAIL,
      name: "Investor Demo Guest",
      role: PlatformRole.USER,
      accountStatus: "ACTIVE",
    },
    update: { email: GUEST_EMAIL, name: "Investor Demo Guest" },
  });

  await prisma.shortTermListing.upsert({
    where: { id: INVESTOR_DEMO_IDS.BNHUB_LISTING },
    create: {
      id: INVESTOR_DEMO_IDS.BNHUB_LISTING,
      listingCode: INVESTOR_DEMO_IDS.BNHUB_LISTING_CODE,
      title: "Skyline Loft — Investor Demo Stay",
      address: "1000 Rue Demo",
      city: "Montréal",
      region: "QC",
      country: "CA",
      nightPriceCents: 28_900,
      currency: "CAD",
      beds: 2,
      baths: 1,
      maxGuests: 4,
      ownerId: INVESTOR_DEMO_IDS.HOST_USER,
      listingStatus: ListingStatus.PUBLISHED,
      verificationStatus: VerificationStatus.VERIFIED,
      listingVerificationStatus: ListingVerificationStatus.VERIFIED,
      legalRentRightAttestedAt: new Date(),
      legalRentRightAttestationVersion: LEGAL_RENT_RIGHT_ATTESTATION_VERSION,
      description: "Premium demo stay for investor sessions — waterfront views, curated for BNHUB booking narrative.",
    },
    update: {
      title: "Skyline Loft — Investor Demo Stay",
      listingStatus: ListingStatus.PUBLISHED,
      nightPriceCents: 28_900,
      listingVerificationStatus: ListingVerificationStatus.VERIFIED,
      legalRentRightAttestedAt: new Date(),
      legalRentRightAttestationVersion: LEGAL_RENT_RIGHT_ATTESTATION_VERSION,
    },
  });

  await prisma.fsboListing.upsert({
    where: { id: INVESTOR_DEMO_IDS.FSBO_LISTING },
    create: {
      id: INVESTOR_DEMO_IDS.FSBO_LISTING,
      listingCode: INVESTOR_DEMO_IDS.FSBO_LISTING_CODE,
      ownerId: INVESTOR_DEMO_IDS.HOST_USER,
      title: "Plateau Townhome — Investor Demo Listing",
      description:
        "Investor demo resale narrative — single-family Plateau property with platform broker and CRM inquiry path.",
      priceCents: 92_500_000,
      address: "2000 Avenue Demo",
      city: "Montréal",
      region: "QC",
      country: "CA",
      contactEmail: HOST_EMAIL,
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      bedrooms: 3,
      bathrooms: 2,
      images: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
      ],
      propertyType: "SINGLE_FAMILY",
    },
    update: {
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      title: "Plateau Townhome — Investor Demo Listing",
    },
  });

  await prisma.lead.upsert({
    where: { id: INVESTOR_DEMO_IDS.CRM_LEAD },
    create: {
      id: INVESTOR_DEMO_IDS.CRM_LEAD,
      name: "Jordan Lee",
      email: "jordan.lee@investor-demo.lecipm",
      phone: "+15145550123",
      message:
        "Pre-approved buyer — requesting a weekend showing and platform broker assist for offer prep.",
      status: "new",
      score: 86,
      fsboListingId: INVESTOR_DEMO_IDS.FSBO_LISTING,
      listingCode: INVESTOR_DEMO_IDS.FSBO_LISTING_CODE,
      leadSource: "listing",
      aiTier: "hot",
      pipelineStage: "qualified",
      pipelineStatus: "qualified",
      nextBestAction: "Schedule showing + attach mortgage pre-approval",
    },
    update: {
      fsboListingId: INVESTOR_DEMO_IDS.FSBO_LISTING,
      score: 86,
      pipelineStage: "qualified",
    },
  });

  const checkIn = new Date("2026-06-01T15:00:00.000Z");
  const checkOut = new Date("2026-06-04T11:00:00.000Z");

  await prisma.booking.upsert({
    where: { id: INVESTOR_DEMO_IDS.BOOKING },
    create: {
      id: INVESTOR_DEMO_IDS.BOOKING,
      guestId: INVESTOR_DEMO_IDS.GUEST_USER,
      listingId: INVESTOR_DEMO_IDS.BNHUB_LISTING,
      checkIn,
      checkOut,
      nights: 3,
      totalCents: 86_700,
      guestFeeCents: 10_400,
      hostFeeCents: 8_670,
      status: BookingStatus.CONFIRMED,
      confirmationCode: "BNH-INVDEMO",
    },
    update: {
      status: BookingStatus.CONFIRMED,
      totalCents: 86_700,
    },
  });

  await prisma.internalCrmEvent.deleteMany({
    where: {
      OR: [
        { bookingId: INVESTOR_DEMO_IDS.BOOKING, eventType: "booking_confirmed" },
        { leadId: INVESTOR_DEMO_IDS.CRM_LEAD, eventType: "cta_click" },
      ],
    },
  });
  await prisma.internalCrmEvent.createMany({
    data: [
      {
        eventType: "booking_confirmed",
        channel: "bnhub",
        userId: INVESTOR_DEMO_IDS.GUEST_USER,
        bookingId: INVESTOR_DEMO_IDS.BOOKING,
        shortTermListingId: INVESTOR_DEMO_IDS.BNHUB_LISTING,
        metadata: {
          investor_demo: true,
          narrative: "revenue_event",
          platform_fee_cents: 10400,
        },
      },
      {
        eventType: "cta_click",
        channel: "fsbo",
        leadId: INVESTOR_DEMO_IDS.CRM_LEAD,
        fsboListingId: INVESTOR_DEMO_IDS.FSBO_LISTING,
        metadata: { investor_demo: true, narrative: "inquiry_to_crm" },
      },
    ],
  });

  // eslint-disable-next-line no-console
  console.log("LECIPM DEMO DATA SEEDED");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
