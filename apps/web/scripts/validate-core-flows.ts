/**
 * Prisma integration checks for BNHub + core user/admin flows (no HTTP server).
 * Safe: creates ephemeral rows and deletes them in a finally block.
 *
 * Run: pnpm --filter @lecipm/web run validate:flows
 * Requires: DATABASE_URL, schema applied, optional seed users (guest@demo.com, host from seed).
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

config({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();
const runId = `e2e-${Date.now()}`;

type Cleanup = () => Promise<void>;
const cleanups: Cleanup[] = [];

function defer(fn: Cleanup): void {
  cleanups.push(fn);
}

async function run(): Promise<void> {
  console.log("[validate:flows] Starting core flow checks…");

  const host =
    (await prisma.user.findFirst({
      where: { email: "host@demo.com" },
      select: { id: true },
    })) ||
    (await prisma.user.findFirst({
      where: { role: "HOST" },
      select: { id: true },
    }));
  const guest =
    (await prisma.user.findFirst({
      where: { email: "guest@demo.com" },
      select: { id: true },
    })) ||
    (await prisma.user.findFirst({
      where: { role: "USER" },
      select: { id: true },
    }));

  if (!host || !guest) {
    throw new Error(
      "Missing seed users: need a HOST (e.g. host1@demo.com) and USER/guest (e.g. guest@demo.com). Run: pnpm db:seed",
    );
  }

  // --- A. Listing + photo (DB row = upload metadata) ---
  const listingCode = `LST-${runId}`;
  const listing = await prisma.shortTermListing.create({
    data: {
      listingCode,
      title: `Flow test listing ${runId}`,
      address: "1 Test St",
      city: "Montreal",
      region: "QC",
      country: "CA",
      nightPriceCents: 10_000,
      beds: 1,
      baths: 1,
      ownerId: host.id,
      listingStatus: "DRAFT",
      photos: [],
    },
  });
  defer(async () => {
    await prisma.shortTermListing.delete({ where: { id: listing.id } }).catch(() => {});
  });

  await prisma.bnhubListingPhoto.create({
    data: {
      listingId: listing.id,
      url: `https://example.com/flow-placeholder-${runId}.jpg`,
      sortOrder: 0,
      isCover: true,
    },
  });

  const updated = await prisma.shortTermListing.update({
    where: { id: listing.id },
    data: { title: `Updated flow listing ${runId}` },
  });
  if (!updated.title?.includes("Updated")) {
    throw new Error("Listing update did not persist");
  }
  const photoCount = await prisma.bnhubListingPhoto.count({ where: { listingId: listing.id } });
  if (photoCount < 1) throw new Error("Listing photo row missing");
  console.log("[validate:flows] A. Listing create / photo row / edit: OK");

  // --- B. Booking + status ---
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 30);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2);

  const booking = await prisma.booking.create({
    data: {
      guestId: guest.id,
      listingId: listing.id,
      checkIn,
      checkOut,
      nights: 2,
      totalCents: 20_000,
      status: "PENDING",
    },
  });
  defer(async () => {
    await prisma.booking.delete({ where: { id: booking.id } }).catch(() => {});
  });

  const confirmed = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED" },
  });
  if (confirmed.status !== "CONFIRMED") throw new Error("Booking status update failed");
  console.log("[validate:flows] B. Booking create / status: OK");

  // --- C. User create / role ---
  const flowEmail = `flow.user.${runId}@local.test`;
  const hash = await hashPassword("FlowTest_Local_Only_9!");
  const flowUser = await prisma.user.create({
    data: {
      email: flowEmail,
      name: "Flow test user",
      role: "USER",
      passwordHash: hash,
      emailVerifiedAt: new Date(),
    },
  });
  defer(async () => {
    await prisma.user.delete({ where: { id: flowUser.id } }).catch(() => {});
  });

  const roleBump = await prisma.user.update({
    where: { id: flowUser.id },
    data: { role: "TESTER" },
  });
  if (roleBump.role !== "TESTER") throw new Error("Role update failed");
  console.log("[validate:flows] C. User create / role: OK");

  // --- D. Admin-style moderation + host application ---
  const issue = await prisma.bookingIssue.create({
    data: {
      bookingId: booking.id,
      issueType: "other",
      description: `flow test ${runId}`,
      status: "open",
    },
  });
  defer(async () => {
    await prisma.bookingIssue.delete({ where: { id: issue.id } }).catch(() => {});
  });

  const moderated = await prisma.bookingIssue.update({
    where: { id: issue.id },
    data: { status: "reviewing" },
  });
  if (moderated.status !== "reviewing") throw new Error("Issue moderation update failed");
  console.log("[validate:flows] D. Booking issue (moderation) update: OK");

  const app = await prisma.hostApplication.create({
    data: {
      userId: flowUser.id,
      fullName: "Flow Host",
      email: flowEmail,
      status: "pending",
    },
  });
  defer(async () => {
    await prisma.hostApplication.delete({ where: { id: app.id } }).catch(() => {});
  });

  const approved = await prisma.hostApplication.update({
    where: { id: app.id },
    data: { status: "approved", reviewedAt: new Date(), reviewedBy: host.id },
  });
  if (approved.status !== "approved") throw new Error("Host application approve failed");
  console.log("[validate:flows] D. Host application approve: OK");

  console.log("[validate:flows] All core DB flows passed.");
}

async function main(): Promise<void> {
  try {
    await prisma.$connect();
    await run();
  } catch (e) {
    console.error("[validate:flows] FAILED:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  } finally {
    for (const fn of cleanups.reverse()) {
      await fn();
    }
    await prisma.$disconnect().catch(() => {});
  }
}

void main();
