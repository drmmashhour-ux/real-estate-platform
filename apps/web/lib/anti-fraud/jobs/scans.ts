/**
 * Background fraud scan jobs: hourly listing scan, daily cadastre duplicate, daily broker activity.
 */

import { prisma } from "@/lib/db";
import { runFraudCheckForListing } from "../services/check-listing";

export async function runHourlyListingScan(): Promise<{ checked: number; frozen: number }> {
  const listings = await prisma.shortTermListing.findMany({
    where: {
      listingVerificationStatus: { in: ["DRAFT", "PENDING_VERIFICATION", "PENDING_DOCUMENTS"] },
      listingStatus: { not: "UNDER_INVESTIGATION" },
    },
    select: { id: true },
    take: 200,
  });
  let frozen = 0;
  for (const l of listings) {
    try {
      const result = await runFraudCheckForListing(l.id);
      if (result.frozen) frozen++;
    } catch (e) {
      console.error("Fraud check failed for listing", l.id, e);
    }
  }
  return { checked: listings.length, frozen };
}

export async function runDailyCadastreDuplicateScan(): Promise<{ alertsCreated: number }> {
  const duplicates = await prisma.shortTermListing.groupBy({
    by: ["cadastreNumber"],
    where: {
      cadastreNumber: { not: null },
      listingVerificationStatus: { in: ["PENDING_VERIFICATION", "VERIFIED"] },
    },
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });
  let alertsCreated = 0;
  for (const d of duplicates) {
    if (!d.cadastreNumber) continue;
    const listings = await prisma.shortTermListing.findMany({
      where: { cadastreNumber: d.cadastreNumber },
      select: { id: true },
    });
    for (const l of listings) {
      const existing = await prisma.propertyFraudAlert.findFirst({
        where: { listingId: l.id, alertType: "duplicate_cadastre", status: "open" },
      });
      if (existing) continue;
      await prisma.propertyFraudAlert.create({
        data: {
          listingId: l.id,
          alertType: "duplicate_cadastre",
          severity: "high",
          message: `Cadastre number ${d.cadastreNumber} used on ${d._count.id} listings.`,
          status: "open",
        },
      });
      alertsCreated++;
    }
  }
  return { alertsCreated };
}

export async function runDailyBrokerActivityScan(): Promise<{ updated: number }> {
  const brokers = await prisma.shortTermListing.findMany({
    where: { listingAuthorityType: "BROKER" },
    select: { ownerId: true },
    distinct: ["ownerId"],
  });
  const userIds = [...new Set(brokers.map((b) => b.ownerId))];
  let updated = 0;
  for (const brokerId of userIds) {
    const [listingCount, rejected, withAuth] = await Promise.all([
      prisma.shortTermListing.count({ where: { ownerId: brokerId, listingAuthorityType: "BROKER" } }),
      prisma.shortTermListing.count({ where: { ownerId: brokerId, listingVerificationStatus: "REJECTED" } }),
      prisma.shortTermListing.count({
        where: {
          ownerId: brokerId,
          listingAuthorityType: "BROKER",
          propertyDocuments: { some: { documentType: "BROKER_AUTHORIZATION" } },
        },
      }),
    ]);
    const fraudFlags = rejected + Math.max(0, listingCount - withAuth);
    const riskScore = Math.min(100, Math.floor((rejected / Math.max(1, listingCount)) * 50) + fraudFlags * 5);
    await prisma.brokerActivityScore.upsert({
      where: { brokerId },
      create: { brokerId, listingCount, fraudFlags, riskScore },
      update: { listingCount, fraudFlags, riskScore },
    });
    updated++;
  }
  return { updated };
}
