/**
 * E2E readiness checklist: DB rows for @test.com users + seeded listing codes.
 * Run from apps/web: pnpm exec tsx scripts/test-e2e-checklist.ts
 * Or from repo root: pnpm test:e2e:checklist (via scripts/test-e2e-checklist.cjs)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_EMAIL_SUFFIX = "@test.com";

async function main() {
  console.log("[e2e-checklist] Simulated events (DB verification only)\n");

  const users = await prisma.user.findMany({
    where: { email: { endsWith: TEST_EMAIL_SUFFIX, mode: "insensitive" } },
    select: { id: true, email: true, role: true },
    orderBy: { email: "asc" },
  });
  console.log(`[e2e-checklist] test users: ${users.length}`);
  for (const u of users) {
    console.log(`  - ${u.email} (${u.role}) id=${u.id}`);
  }

  const e2eListings = await prisma.shortTermListing.count({
    where: { listingCode: { startsWith: "LST-E2E", mode: "insensitive" } },
  });
  const e2eFsbo = await prisma.fsboListing.count({
    where: { title: { contains: "E2E", mode: "insensitive" } },
  });
  const e2eCrm = await prisma.listing.count({
    where: {
      OR: [
        { listingCode: { startsWith: "LST-E2E01", mode: "insensitive" } },
        { title: { contains: "E2E CRM", mode: "insensitive" } },
      ],
    },
  });

  console.log(`\n[e2e-checklist] seeded stays (LST-E2E*): ${e2eListings}`);
  console.log(`[e2e-checklist] seeded FSBO (title contains E2E): ${e2eFsbo}`);
  console.log(`[e2e-checklist] seeded CRM (LST-E2E01* / E2E CRM title): ${e2eCrm}`);

  const guestIds = users.map((u) => u.id);
  const bookings =
    guestIds.length === 0
      ? []
      : await prisma.booking.findMany({
          where: { guestId: { in: guestIds } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            status: true,
            confirmationCode: true,
            totalCents: true,
            createdAt: true,
            listing: { select: { listingCode: true, city: true } },
          },
        });
  console.log(`\n[e2e-checklist] recent test-user bookings: ${bookings.length}`);
  for (const b of bookings) {
    console.log(
      `  - ${b.id.slice(0, 8)}… status=${b.status} code=${b.confirmationCode ?? "—"} ${b.listing.city} (${b.listing.listingCode})`,
    );
  }

  const payments =
    guestIds.length === 0
      ? []
      : await prisma.platformPayment.findMany({
          where: { userId: { in: guestIds } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            paymentType: true,
            status: true,
            amountCents: true,
            stripeSessionId: true,
            createdAt: true,
          },
        });
  console.log(`\n[e2e-checklist] recent test-user platform payments: ${payments.length}`);
  for (const p of payments) {
    console.log(
      `  - ${p.paymentType} status=${p.status} amount=${p.amountCents} session=${p.stripeSessionId ?? "—"}`,
    );
  }

  const unlocks =
    guestIds.length === 0
      ? []
      : await prisma.listingContactLeadPurchase.findMany({
          where: { buyerUserId: { in: guestIds } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            targetKind: true,
            status: true,
            paidAt: true,
            targetListingId: true,
          },
        });
  console.log(`\n[e2e-checklist] listing contact unlocks (test users): ${unlocks.length}`);
  for (const u of unlocks) {
    console.log(`  - ${u.targetKind} listing=${u.targetListingId.slice(0, 8)}… status=${u.status} paidAt=${u.paidAt?.toISOString() ?? "—"}`);
  }

  const payouts =
    guestIds.length === 0
      ? []
      : await prisma.orchestratedPayout.findMany({
          where: { hostId: { in: guestIds } },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, status: true, amountCents: true, bookingId: true },
        });
  console.log(`\n[e2e-checklist] orchestrated payouts (test hosts): ${payouts.length}`);

  const okUsers = users.length >= 4;
  const okSeed = e2eListings >= 6 && e2eFsbo >= 1 && e2eCrm >= 1;
  console.log(`\n[e2e-checklist] RESULT: users=${okUsers ? "ok" : "MISSING — run pnpm seed:test"} seed=${okSeed ? "ok" : "INCOMPLETE — run pnpm seed:test"}`);

  const base = process.env.TEST_E2E_BASE_URL?.replace(/\/$/, "");
  if (base) {
    const paths = ["/", "/listings", "/admin/test-mode", "/bnhub/stays"];
    console.log(`\n[e2e-checklist] HTTP smoke (TEST_E2E_BASE_URL=${base})`);
    for (const p of paths) {
      try {
        const url = `${base}${p}`;
        const res = await fetch(url, { redirect: "manual" });
        const ok = res.status >= 200 && res.status < 400;
        console.log(`  ${ok ? "✓" : "✗"} ${p} → ${res.status}`);
      } catch (e) {
        console.log(`  ✗ ${p} → error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    const sampleStay = await prisma.shortTermListing.findFirst({
      where: { listingCode: { startsWith: "LST-E2E", mode: "insensitive" } },
      select: { listingCode: true },
    });
    if (sampleStay?.listingCode) {
      const stayPath = `/stays/${encodeURIComponent(sampleStay.listingCode)}`;
      try {
        const res = await fetch(`${base}${stayPath}`, { redirect: "manual" });
        const ok = res.status >= 200 && res.status < 400;
        console.log(`  ${ok ? "✓" : "✗"} ${stayPath} → ${res.status}`);
      } catch (e) {
        console.log(`  ✗ ${stayPath} → error: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } else {
    console.log("\n[e2e-checklist] HTTP smoke skipped (set TEST_E2E_BASE_URL e.g. http://127.0.0.1:3001)");
  }
}

main()
  .catch((e) => {
    console.error("[e2e-checklist] failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
