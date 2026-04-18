import { prisma } from "@/lib/db";

export type BnhubTrustScores = {
  listingTrust: number | null;
  hostTrustFromProfile: number | null;
  overallRiskLevel: string | null;
};

export async function getBnhubListingTrustScores(listingId: string): Promise<BnhubTrustScores> {
  const row = await prisma.bnhubTrustProfile.findUnique({
    where: { listingId },
    select: { trustScore: true, overallRiskLevel: true, hostUserId: true },
  });
  return {
    listingTrust: row?.trustScore ?? null,
    hostTrustFromProfile: row?.trustScore ?? null,
    overallRiskLevel: row?.overallRiskLevel ?? null,
  };
}
