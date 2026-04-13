import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function requireListingOwnerOrAdmin(listingId: string) {
  const userId = await getGuestId();
  if (!userId) return { ok: false as const, status: 401, error: "Sign in required" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "ADMIN") {
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { id: true, ownerId: true },
    });
    if (!listing) return { ok: false as const, status: 404, error: "Listing not found" };
    return { ok: true as const, userId, listing, isAdmin: true };
  }

  const listing = await prisma.shortTermListing.findFirst({
    where: { id: listingId, ownerId: userId },
    select: { id: true, ownerId: true },
  });
  if (!listing) return { ok: false as const, status: 403, error: "Forbidden" };
  return { ok: true as const, userId, listing, isAdmin: false };
}

export async function requireSuggestionAccess(suggestionId: string) {
  const userId = await getGuestId();
  if (!userId) return { ok: false as const, status: 401, error: "Sign in required" };

  const s = await prisma.listingOptimizationSuggestion.findUnique({
    where: { id: suggestionId },
    include: { listing: { select: { id: true, ownerId: true } } },
  });
  if (!s || !s.listing) return { ok: false as const, status: 404, error: "Not found" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "ADMIN") {
    return { ok: true as const, userId, suggestion: s, isAdmin: true };
  }
  if (s.listing.ownerId !== userId) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const, userId, suggestion: s, isAdmin: false };
}
