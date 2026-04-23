import { prisma } from "@/lib/db";

/**
 * Enforces: caller is the lead-linked platform user, the listing owner broker, or admin.
 */
export async function assertVisitBookingAccess(input: {
  userId: string;
  leadId: string;
  listingId: string;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const [lead, user] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: input.leadId },
      select: { userId: true, listingId: true, fsboListingId: true },
    }),
    prisma.user.findUnique({ where: { id: input.userId }, select: { role: true, accountStatus: true } }),
  ]);
  if (!lead) {
    return { ok: false, status: 404, error: "Lead not found" };
  }
  if (user?.accountStatus !== "ACTIVE" || !user) {
    return { ok: false, status: 401, error: "Invalid session" };
  }
  if (user.role === "ADMIN") {
    return { ok: true };
  }
  if (lead.userId && lead.userId === input.userId) {
    return { ok: true };
  }
  const crm = await prisma.listing.findUnique({
    where: { id: input.listingId },
    select: { id: true, ownerId: true },
  });
  if (crm && crm.ownerId === input.userId) {
    if (lead.listingId && lead.listingId !== input.listingId) {
      return { ok: false, status: 400, error: "Listing does not match lead" };
    }
    return { ok: true };
  }
  if (lead.listingId && lead.listingId !== input.listingId) {
    return { ok: false, status: 400, error: "Listing does not match lead" };
  }
  return { ok: false, status: 403, error: "Not allowed to book for this lead" };
}
