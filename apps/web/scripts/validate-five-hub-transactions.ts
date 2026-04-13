/**
 * Five full transactional flows across platform hubs (DB integration; no HTTP server).
 * Mirrors real product surfaces: BNHUB stay, Buy CRM lead, Mortgage partner interest,
 * FSBO seller listing + buyer lead, broker-attributed residential deal + milestone.
 *
 * Run (from repo root): pnpm validate:five-hub-transactions
 * Requires: DATABASE_URL, migrations applied, seed users (see validate:flows).
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();
const runId = `5hub-${Date.now()}`;

type Cleanup = () => Promise<void>;
const cleanups: Cleanup[] = [];

function defer(fn: Cleanup): void {
  cleanups.push(fn);
}

async function main(): Promise<void> {
  console.log("[validate:five-hub-transactions] Starting 5 hub transaction checks…\n");

  const host =
    (await prisma.user.findFirst({ where: { email: "host@demo.com" }, select: { id: true, email: true } })) ||
    (await prisma.user.findFirst({ where: { role: "HOST" }, select: { id: true, email: true } }));
  const guest =
    (await prisma.user.findFirst({ where: { email: "guest@demo.com" }, select: { id: true, email: true } })) ||
    (await prisma.user.findFirst({ where: { role: "USER" }, select: { id: true, email: true } }));
  const broker =
    (await prisma.user.findFirst({ where: { email: "broker@demo.com" }, select: { id: true } })) ||
    (await prisma.user.findFirst({ where: { role: "BROKER" }, select: { id: true } }));
  const investor =
    (await prisma.user.findFirst({ where: { email: "investor@demo.com" }, select: { id: true, email: true } })) ||
    (await prisma.user.findFirst({ where: { role: "INVESTOR" }, select: { id: true, email: true } }));

  if (!host || !guest || !broker || !investor) {
    throw new Error(
      "Missing seed users: need host@demo.com, guest@demo.com, broker@demo.com, investor@demo.com (or matching roles). Run: pnpm db:seed",
    );
  }

  // --- TX1 · BNHUB (short-term stay) — listing → booking → confirmed ---
  const listingCode = `L5-${runId}`;
  const stListing = await prisma.shortTermListing.create({
    data: {
      listingCode,
      title: `5-hub BNHUB listing ${runId}`,
      address: "100 Hub Test Ave",
      city: "Montreal",
      region: "QC",
      country: "CA",
      nightPriceCents: 12_000,
      beds: 2,
      baths: 1,
      ownerId: host.id,
      listingStatus: "DRAFT",
      photos: [],
    },
  });
  defer(() => prisma.shortTermListing.delete({ where: { id: stListing.id } }).catch(() => {}));

  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 14);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);

  const booking = await prisma.booking.create({
    data: {
      guestId: guest.id,
      listingId: stListing.id,
      checkIn,
      checkOut,
      nights: 3,
      totalCents: 36_000,
      status: "PENDING",
    },
  });
  defer(() => prisma.booking.delete({ where: { id: booking.id } }).catch(() => {}));

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED" },
  });
  console.log("  ✓ TX1 BNHUB — ShortTermListing + Booking CONFIRMED");

  // --- TX2 · Buy / CRM — marketplace-style buyer lead (no FSBO attach) ---
  const buyLead = await prisma.lead.create({
    data: {
      name: `Buy hub lead ${runId}`,
      email: `buy-lead-${runId}@local.test`,
      phone: "+15145550002",
      message: "5-hub test — inquiry from /listings / Buy hub funnel.",
      status: "new",
      score: 62,
      pipelineStatus: "new",
      pipelineStage: "new",
      leadSource: "listing",
      source: "validate_five_hub_tx",
    },
  });
  defer(() => prisma.lead.delete({ where: { id: buyLead.id } }).catch(() => {}));
  await prisma.lead.update({
    where: { id: buyLead.id },
    data: { pipelineStatus: "contacted", pipelineStage: "contacted" },
  });
  console.log("  ✓ TX2 Buy hub — CRM Lead created + pipeline advance");

  // --- TX3 · Financial / Mortgage — partner interest table when migrated; else mortgage CRM lead ---
  try {
    const mInterest = await prisma.mortgageBrokerProgramInterest.create({
      data: {
        email: `mortgage-int-${runId}@local.test`,
        name: "5-hub mortgage partner test",
        planSlug: "gold",
        message: "Validate script — full transaction across hubs.",
        source: "for-brokers",
      },
    });
    defer(() => prisma.mortgageBrokerProgramInterest.delete({ where: { id: mInterest.id } }).catch(() => {}));
    console.log("  ✓ TX3 Financial hub — MortgageBrokerProgramInterest recorded");
  } catch {
    const expert = await prisma.mortgageExpert.findFirst({ select: { id: true } });
    const mLead = await prisma.lead.create({
      data: {
        name: "Mortgage client (5-hub test)",
        email: `mortgage-lead-${runId}@local.test`,
        phone: "+15145550003",
        message: "Pre-approval request — validate five-hub script (fallback when partner-interest table missing).",
        status: "new",
        score: 70,
        pipelineStatus: "new",
        pipelineStage: "new",
        leadSource: "mortgage_inquiry",
        leadType: "mortgage",
        mortgageInquiry: { city: "Montreal", maxPurchase: 600000, propertyType: "house", timeline: "60d" },
        ...(expert ? { assignedExpertId: expert.id, mortgageAssignedAt: new Date() } : {}),
      },
    });
    defer(() => prisma.lead.delete({ where: { id: mLead.id } }).catch(() => {}));
    console.log("  ✓ TX3 Financial hub — mortgage Lead recorded (MortgageBrokerProgramInterest table unavailable)");
  }

  // --- TX4 · Seller (FSBO) — draft listing → verification + buyer FsboLead ---
  const fsboCode = `FS5-${runId}`;
  const fsbo = await prisma.fsboListing.create({
    data: {
      listingCode: fsboCode,
      ownerId: investor.id,
      title: `5-hub FSBO ${runId}`,
      description: "Integration test listing — seller hub publish path.",
      priceCents: 399_000 * 100,
      address: "200 Seller Lane",
      city: "Laval",
      region: "QC",
      country: "CA",
      bedrooms: 3,
      bathrooms: 2,
      images: [],
      contactEmail: investor.email ?? "investor@demo.com",
      status: "DRAFT",
      moderationStatus: "APPROVED",
    },
  });
  defer(() => prisma.fsboListing.delete({ where: { id: fsbo.id } }).catch(() => {}));

  await prisma.fsboListing.update({
    where: { id: fsbo.id },
    data: { status: "PENDING_VERIFICATION" },
  });

  const fsboLead = await prisma.fsboLead.create({
    data: {
      listingId: fsbo.id,
      name: "Guest buyer (test)",
      email: guest.email ?? "guest@demo.com",
      message: "5-hub test — contact seller on FSBO listing.",
      leadSource: "DIRECT_BUYER",
      dealOriginTag: "PLATFORM_ORIGIN",
      commissionEligible: true,
    },
  });
  defer(() => prisma.fsboLead.delete({ where: { id: fsboLead.id } }).catch(() => {}));
  console.log("  ✓ TX4 Seller hub — FSBO draft → PENDING_VERIFICATION + FsboLead");

  // --- TX5 · Broker / Deal — residential deal + milestone (closing workflow) ---
  const priceCents = 450_000 * 100;
  const deal = await prisma.deal.create({
    data: {
      dealCode: `DEL-5HUB-${runId}`,
      listingId: fsbo.id,
      listingCode: fsboCode,
      buyerId: guest.id,
      sellerId: investor.id,
      brokerId: broker.id,
      priceCents,
      status: "initiated",
      commissionEligible: true,
    },
  });
  defer(() => prisma.deal.delete({ where: { id: deal.id } }).catch(() => {}));

  const milestone = await prisma.dealMilestone.create({
    data: {
      dealId: deal.id,
      name: "Deposit received",
      status: "pending",
    },
  });

  await prisma.dealMilestone.update({
    where: { id: milestone.id },
    data: { status: "completed", completedAt: new Date() },
  });

  await prisma.deal.update({
    where: { id: deal.id },
    data: { status: "offer_submitted", crmStage: "negotiation" },
  });
  console.log("  ✓ TX5 Broker / deal hub — Deal + milestone + status advance");

  console.log("\n[validate:five-hub-transactions] All 5 hub transactions completed successfully.");
  console.log(
    "  Hubs: BNHUB (stay) · Buy (CRM) · Financial (mortgage interest) · Seller (FSBO) · Broker (deal).\n",
  );
}

async function run(): Promise<void> {
  try {
    await prisma.$connect();
    await main();
  } catch (e) {
    console.error("[validate:five-hub-transactions] FAILED:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  } finally {
    for (const fn of cleanups.reverse()) {
      await fn();
    }
    await prisma.$disconnect().catch(() => {});
  }
}

void run();
