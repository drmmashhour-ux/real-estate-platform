import { prisma } from "@/lib/db";

export type AlertExplanationContext = {
  alert: NonNullable<Awaited<ReturnType<typeof prisma.watchlistAlert.findUnique>>>;
  listing: {
    id: string;
    title: string;
    city: string;
    priceCents: number;
    status: string;
    trustScore: number | null;
    riskScore: number | null;
  } | null;
  dealAnalysis: {
    id: string;
    investmentScore: number;
    riskScore: number;
    recommendation: string;
    analysisType: string;
    createdAt: Date;
  } | null;
  watchlistSnapshot: {
    dealScore: number | null;
    trustScore: number | null;
    listingStatus: string | null;
  } | null;
};

export async function buildAlertContext(alertId: string): Promise<AlertExplanationContext> {
  const alert = await prisma.watchlistAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new Error("ALERT_NOT_FOUND");
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: alert.listingId },
    select: {
      id: true,
      title: true,
      city: true,
      priceCents: true,
      status: true,
      trustScore: true,
      riskScore: true,
    },
  });

  const dealAnalysis = await prisma.dealAnalysis.findFirst({
    where: { propertyId: alert.listingId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      investmentScore: true,
      riskScore: true,
      recommendation: true,
      analysisType: true,
      createdAt: true,
    },
  });

  const watchlistSnapshot = await prisma.watchlistSnapshot.findFirst({
    where: { userId: alert.userId, listingId: alert.listingId },
    orderBy: { createdAt: "desc" },
    select: {
      dealScore: true,
      trustScore: true,
      listingStatus: true,
    },
  });

  return {
    alert,
    listing,
    dealAnalysis,
    watchlistSnapshot,
  };
}
