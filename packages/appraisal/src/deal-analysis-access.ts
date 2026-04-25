import { prisma } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export async function canAccessDealAnalysisForListing(
  dealAnalysisId: string,
  userId: string | null,
): Promise<boolean> {
  if (!userId) return false;
  if (await isPlatformAdmin(userId)) return true;

  const row = await prisma.dealAnalysis.findUnique({
    where: { id: dealAnalysisId },
    select: { propertyId: true },
  });
  if (!row?.propertyId) return false;

  const listing = await prisma.fsboListing.findUnique({
    where: { id: row.propertyId },
    select: { ownerId: true },
  });
  return listing?.ownerId === userId;
}
