/**
 * Minimal deterministic rows to unblock functional QA: public FSBO browse + BNHub stay card.
 * Run from apps/web: pnpm seed:qa-blockers
 *
 * Requires DATABASE_URL and migrations applied. Safe to re-run (upserts by fixed ids).
 *
 * Do not run against production unless you intentionally set ALLOW_QA_SEED_IN_PRODUCTION=1
 * (creates test users including admin@test.com — disable that login in prod via login route).
 */
import path from "node:path";
import { config } from "dotenv";
import { ListingVerificationStatus, PlatformRole, VerificationStatus } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { LEGAL_RENT_RIGHT_ATTESTATION_VERSION } from "../lib/bnhub/legal-rent-attestation-policy";
import { prisma } from "../lib/db";
import { CONTENT_LICENSE_VERSION } from "../modules/legal/content-license";
import { MARKETPLACE_CONTRACT_TYPES } from "../lib/contracts/marketplace-contract-types";
import { BROKER_ISOLATION_SEED } from "../lib/e2e/broker-isolation-constants";

config({ path: path.join(__dirname, "../.env") });

if (process.env.NODE_ENV === "production" && process.env.ALLOW_QA_SEED_IN_PRODUCTION !== "1") {
  console.error(
    "Refusing seed-qa-blockers in production. Use real admin accounts and migrations only. Set ALLOW_QA_SEED_IN_PRODUCTION=1 to override (not recommended)."
  );
  process.exit(1);
}

/** FSBO `id` must be a single URL tail segment matching `parseTailListingIdFromSlug` (cuid-like) or lookups fail. */
const QA_IDS = {
  host: "qa-blocker-bnhub-host-001",
  seller: "qa-blocker-fsbo-seller-001",
  fsbo: "clqablockerfsbolstseed001",
  stay: "stay-test-001",
} as const;

const DEMO_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop";

async function main() {
  await prisma.fsboListing.deleteMany({ where: { id: "qa-blocker-fsbo-listing-001" } }).catch(() => {});

  const pw = await hashPassword("QaBlocker2024!");
  const guestLoginPw = await hashPassword("DemoGuest2024!");

  const guestUser = await prisma.user.upsert({
    where: { email: "guest@demo.com" },
    update: {
      passwordHash: guestLoginPw,
      emailVerifiedAt: new Date(),
      accountStatus: "ACTIVE",
    },
    create: {
      email: "guest@demo.com",
      name: "QA Guest",
      role: PlatformRole.USER,
      passwordHash: guestLoginPw,
      emailVerifiedAt: new Date(),
      accountStatus: "ACTIVE",
    },
  });

  await prisma.contentLicensePolicy.upsert({
    where: { id: "global" },
    create: { id: "global", currentVersion: CONTENT_LICENSE_VERSION },
    update: {},
  });
  await prisma.contentLicenseAcceptance.upsert({
    where: { userId: guestUser.id },
    create: { userId: guestUser.id, version: CONTENT_LICENSE_VERSION, acceptedAt: new Date() },
    update: { version: CONTENT_LICENSE_VERSION, acceptedAt: new Date() },
  });

  const adminPw = await hashPassword("AdminDemo2024!");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {
      passwordHash: adminPw,
      role: PlatformRole.ADMIN,
      emailVerifiedAt: new Date(),
      accountStatus: "ACTIVE",
      twoFactorEmailEnabled: false,
    },
    create: {
      email: "admin@demo.com",
      name: "QA Admin",
      role: PlatformRole.ADMIN,
      passwordHash: adminPw,
      emailVerifiedAt: new Date(),
      accountStatus: "ACTIVE",
      plan: "free",
    },
  });
  await prisma.contentLicenseAcceptance.upsert({
    where: { userId: adminUser.id },
    create: { userId: adminUser.id, version: CONTENT_LICENSE_VERSION, acceptedAt: new Date() },
    update: { version: CONTENT_LICENSE_VERSION, acceptedAt: new Date() },
  });

  const e2eAdminPw = await hashPassword("password");
  const e2eAdmin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {
      passwordHash: e2eAdminPw,
      role: PlatformRole.ADMIN,
      emailVerifiedAt: new Date(),
      accountStatus: "ACTIVE",
      twoFactorEmailEnabled: false,
    },
    create: {
      email: "admin@test.com",
      name: "E2E Admin",
      role: PlatformRole.ADMIN,
      passwordHash: e2eAdminPw,
      emailVerifiedAt: new Date(),
      accountStatus: "ACTIVE",
      plan: "free",
    },
  });
  await prisma.contentLicenseAcceptance.upsert({
    where: { userId: e2eAdmin.id },
    create: { userId: e2eAdmin.id, version: CONTENT_LICENSE_VERSION, acceptedAt: new Date() },
    update: { version: CONTENT_LICENSE_VERSION, acceptedAt: new Date() },
  });

  const host = await prisma.user.upsert({
    where: { id: QA_IDS.host },
    create: {
      id: QA_IDS.host,
      email: "qa-bnhub-host@lecipm.test",
      name: "QA BNHub Host",
      role: PlatformRole.HOST,
      passwordHash: pw,
      emailVerifiedAt: new Date(),
      accountStatus: "ACTIVE",
    },
    update: {
      emailVerifiedAt: new Date(),
      accountStatus: "ACTIVE",
      role: PlatformRole.HOST,
    },
  });

  const seller = await prisma.user.upsert({
    where: { id: QA_IDS.seller },
    create: {
      id: QA_IDS.seller,
      email: "qa-fsbo-seller@lecipm.test",
      name: "QA FSBO Seller",
      role: PlatformRole.USER,
      passwordHash: pw,
      emailVerifiedAt: new Date(),
      accountStatus: "ACTIVE",
    },
    update: { emailVerifiedAt: new Date(), accountStatus: "ACTIVE" },
  });

  await prisma.fsboListing.upsert({
    where: { id: QA_IDS.fsbo },
    create: {
      id: QA_IDS.fsbo,
      listingCode: "LST-QA-FSBO01",
      ownerId: seller.id,
      title: "QA Montreal rowhouse (seed)",
      description: "Seeded FSBO listing for functional QA — public browse and listing detail.",
      priceCents: 549_000_00,
      address: "2000 QA Rue Example",
      city: "Montreal",
      country: "CA",
      region: "QC",
      images: [DEMO_IMG],
      coverImage: DEMO_IMG,
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      contactEmail: seller.email!,
      listingDealType: "SALE",
      propertyType: "HOUSE",
      bedrooms: 3,
      bathrooms: 2,
    },
    update: {
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      title: "QA Montreal rowhouse (seed)",
      priceCents: 549_000_00,
      contactEmail: seller.email!,
    },
  });

  await prisma.shortTermListing.upsert({
    where: { id: QA_IDS.stay },
    create: {
      id: QA_IDS.stay,
      listingCode: "LST-QA-STAY01",
      title: "Test Stay",
      description: "Seeded BNHub stay for QA — booking and checkout flow.",
      address: "100 QA Stay Street",
      city: "Montreal",
      region: "Quebec",
      country: "CA",
      latitude: 45.5088,
      longitude: -73.5542,
      nightPriceCents: 12_000,
      currency: "CAD",
      beds: 2,
      baths: 1,
      maxGuests: 4,
      photos: [DEMO_IMG],
      amenities: ["WiFi"],
      listingStatus: "PUBLISHED",
      verificationStatus: VerificationStatus.VERIFIED,
      listingVerificationStatus: ListingVerificationStatus.VERIFIED,
      verifiedAt: new Date(),
      legalRentRightAttestedAt: new Date(),
      legalRentRightAttestationVersion: LEGAL_RENT_RIGHT_ATTESTATION_VERSION,
      ownerId: host.id,
      instantBookEnabled: true,
    },
    update: {
      listingStatus: "PUBLISHED",
      verificationStatus: VerificationStatus.VERIFIED,
      listingVerificationStatus: ListingVerificationStatus.VERIFIED,
      legalRentRightAttestedAt: new Date(),
      legalRentRightAttestationVersion: LEGAL_RENT_RIGHT_ATTESTATION_VERSION,
      nightPriceCents: 12_000,
      title: "Test Stay",
      ownerId: host.id,
      instantBookEnabled: true,
    },
  });

  await prisma.booking.deleteMany({ where: { listingId: QA_IDS.stay } });
  await prisma.availabilitySlot.deleteMany({ where: { listingId: QA_IDS.stay } });

  await prisma.contract.deleteMany({
    where: { listingId: QA_IDS.stay, type: MARKETPLACE_CONTRACT_TYPES.HOST_AGREEMENT },
  });
  await prisma.contract.create({
    data: {
      type: MARKETPLACE_CONTRACT_TYPES.HOST_AGREEMENT,
      userId: host.id,
      listingId: QA_IDS.stay,
      status: "signed",
      signed: true,
      signedAt: new Date(),
      title: "BNHub short-term host agreement",
      contentHtml: "<p>QA seed</p>",
      version: "2025-03-22",
      hub: "bnhub",
    },
  });

  const brokerIsolationPw = await hashPassword(BROKER_ISOLATION_SEED.password);
  const brokerAlpha = await prisma.user.upsert({
    where: { id: BROKER_ISOLATION_SEED.alphaUserId },
    create: {
      id: BROKER_ISOLATION_SEED.alphaUserId,
      email: BROKER_ISOLATION_SEED.alphaEmail,
      name: "QA Broker Alpha (E2E isolation)",
      role: PlatformRole.BROKER,
      passwordHash: brokerIsolationPw,
      emailVerifiedAt: new Date(),
      accountStatus: "ACTIVE",
      plan: "free",
    },
    update: {
      email: BROKER_ISOLATION_SEED.alphaEmail,
      passwordHash: brokerIsolationPw,
      role: PlatformRole.BROKER,
      emailVerifiedAt: new Date(),
      accountStatus: "ACTIVE",
      twoFactorEmailEnabled: false,
    },
  });
  const brokerBeta = await prisma.user.upsert({
    where: { id: BROKER_ISOLATION_SEED.betaUserId },
    create: {
      id: BROKER_ISOLATION_SEED.betaUserId,
      email: BROKER_ISOLATION_SEED.betaEmail,
      name: "QA Broker Beta (E2E isolation)",
      role: PlatformRole.BROKER,
      passwordHash: brokerIsolationPw,
      emailVerifiedAt: new Date(),
      accountStatus: "ACTIVE",
      plan: "free",
    },
    update: {
      email: BROKER_ISOLATION_SEED.betaEmail,
      passwordHash: brokerIsolationPw,
      role: PlatformRole.BROKER,
      emailVerifiedAt: new Date(),
      accountStatus: "ACTIVE",
      twoFactorEmailEnabled: false,
    },
  });
  for (const u of [brokerAlpha, brokerBeta]) {
    await prisma.contentLicenseAcceptance.upsert({
      where: { userId: u.id },
      create: { userId: u.id, version: CONTENT_LICENSE_VERSION, acceptedAt: new Date() },
      update: { version: CONTENT_LICENSE_VERSION, acceptedAt: new Date() },
    });
  }

  await prisma.lead.upsert({
    where: { id: BROKER_ISOLATION_SEED.leadAlphaId },
    create: {
      id: BROKER_ISOLATION_SEED.leadAlphaId,
      name: "QA Client (Alpha broker only)",
      email: "qa-lead-client-alpha@lecipm.test",
      phone: "5145550101",
      message: "Seeded lead for broker isolation E2E — owned by Alpha.",
      status: "new",
      score: 40,
      leadSource: "direct",
      introducedByBrokerId: brokerAlpha.id,
      lastFollowUpByBrokerId: null,
    },
    update: {
      introducedByBrokerId: brokerAlpha.id,
      lastFollowUpByBrokerId: null,
      leadSource: "direct",
      name: "QA Client (Alpha broker only)",
      email: "qa-lead-client-alpha@lecipm.test",
    },
  });
  await prisma.lead.upsert({
    where: { id: BROKER_ISOLATION_SEED.leadBetaId },
    create: {
      id: BROKER_ISOLATION_SEED.leadBetaId,
      name: "QA Client (Beta broker only)",
      email: "qa-lead-client-beta@lecipm.test",
      phone: "5145550102",
      message: "Seeded lead for broker isolation E2E — owned by Beta.",
      status: "new",
      score: 41,
      leadSource: "direct",
      introducedByBrokerId: brokerBeta.id,
      lastFollowUpByBrokerId: null,
    },
    update: {
      introducedByBrokerId: brokerBeta.id,
      lastFollowUpByBrokerId: null,
      leadSource: "direct",
      name: "QA Client (Beta broker only)",
      email: "qa-lead-client-beta@lecipm.test",
    },
  });

  await prisma.legalFormSignature.upsert({
    where: {
      userId_formKey_contextType_contextId: {
        userId: guestUser.id,
        formKey: "GUEST_ACKNOWLEDGMENT",
        contextType: "short_term_booking",
        contextId: QA_IDS.stay,
      },
    },
    create: {
      userId: guestUser.id,
      formKey: "GUEST_ACKNOWLEDGMENT",
      contextType: "short_term_booking",
      contextId: QA_IDS.stay,
      version: "qa-seed-1",
    },
    update: { signedAt: new Date(), version: "qa-seed-1" },
  });

  console.log("seed:qa-blockers OK");
  console.log("  FSBO listing:", QA_IDS.fsbo, "— browse /listings → detail");
  console.log("  BNHub stay:", QA_IDS.stay, "— /bnhub/stays → /bnhub/" + QA_IDS.stay);
  console.log("  Guest: guest@demo.com / DemoGuest2024!");
  console.log("  Admin E2E: admin@demo.com / AdminDemo2024! or admin@test.com / password (E2E_ADMIN_*)");
  console.log(
    `  Broker isolation E2E: ${BROKER_ISOLATION_SEED.alphaEmail} & ${BROKER_ISOLATION_SEED.betaEmail} / ${BROKER_ISOLATION_SEED.password}`
  );
  console.log(`    Leads: ${BROKER_ISOLATION_SEED.leadAlphaId} (Alpha), ${BROKER_ISOLATION_SEED.leadBetaId} (Beta)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
