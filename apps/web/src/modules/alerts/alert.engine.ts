import { prisma } from "@/lib/db";
import { expireStaleFsboFeaturedRows } from "@/lib/featured/expire-stale-featured-fsbo";

/**
 * Scan for stale alert candidates (placeholder for future requeue / expiry).
 * Also expires past FSBO featured audit rows (`featured_listings.status`).
 */
export async function runAlertCandidateScan(_opts?: { limit?: number }): Promise<{
  pending: number;
  featuredRowsExpired: number;
}> {
  const pending = await prisma.alertCandidate.count({
    where: { status: "candidate" },
  });
  const { updated } = await expireStaleFsboFeaturedRows();
  return { pending, featuredRowsExpired: updated };
}
