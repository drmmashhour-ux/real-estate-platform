/**
 * Routing suggestions — human assignment remains authoritative (no auto-reassignment here).
 */
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function suggestLeadAssignee(opts: {
  fsboListingId?: string | null;
  brokerHintId?: string | null;
}): Promise<{ assigneeUserId: string | null; reason: string }> {
  if (opts.brokerHintId) {
    return { assigneeUserId: opts.brokerHintId, reason: "Explicit broker hint from capture context." };
  }
  if (opts.fsboListingId) {
    const listing = await prisma.fsboListing.findUnique({
      where: { id: opts.fsboListingId },
      select: { ownerId: true },
    });
    if (listing) {
      return { assigneeUserId: null, reason: "Listing-tied inquiry — route to listing owner workflows / CRM rules." };
    }
  }
  return { assigneeUserId: null, reason: "No automatic assignee; broker pool or admin triage." };
}

export async function isBroker(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return u?.role === PlatformRole.BROKER;
}
