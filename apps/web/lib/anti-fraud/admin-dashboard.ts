import { prisma } from "@/lib/db";

const HIGH_RISK_THRESHOLD = 60;

export async function getHighRiskListings(limit = 50) {
  return prisma.propertyFraudScore.findMany({
    where: {
      OR: [{ riskLevel: "high" }, { fraudScore: { gte: HIGH_RISK_THRESHOLD } }],
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          listingStatus: true,
          cadastreNumber: true,
          ownerId: true,
        },
      },
    },
    orderBy: { fraudScore: "desc" },
    take: limit,
  });
}

export async function getDuplicateCadastreAlerts(limit = 50) {
  return prisma.propertyFraudAlert.findMany({
    where: { alertType: "duplicate_cadastre", status: "open" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          cadastreNumber: true,
          listingStatus: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getSuspiciousBrokers(limit = 30) {
  return prisma.brokerActivityScore.findMany({
    where: { riskScore: { gt: 0 } },
    include: {
      broker: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { riskScore: "desc" },
    take: limit,
  });
}

export async function getUnderInvestigationListings(limit = 50) {
  return prisma.shortTermListing.findMany({
    where: { listingStatus: "UNDER_INVESTIGATION" },
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      listingStatus: true,
      cadastreNumber: true,
      ownerId: true,
      propertyFraudScores: { take: 1, orderBy: { createdAt: "desc" } },
    },
    orderBy: { id: "asc" },
    take: limit,
  });
}
