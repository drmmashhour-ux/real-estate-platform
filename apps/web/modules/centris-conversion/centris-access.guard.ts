import { prisma } from "@/lib/db";

/** Broker owns the listing context on the lead, or actor is ADMIN. */
export async function brokerCanAccessCentrisLead(actorId: string, role: string | undefined, leadId: string): Promise<boolean> {
  if (role === "ADMIN") return true;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      fsboListing: { select: { ownerId: true } },
      listingId: true,
    },
  });

  if (!lead) return false;
  if (lead.fsboListing?.ownerId === actorId) return true;

  if (lead.listingId) {
    const listing = await prisma.listing.findUnique({
      where: { id: lead.listingId },
      select: { ownerId: true },
    });
    if (listing?.ownerId === actorId) return true;
  }

  return false;
}
