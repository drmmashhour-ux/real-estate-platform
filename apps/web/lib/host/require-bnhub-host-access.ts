import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export type BnhubHostAccess =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Web session hosts: HOST role, ADMIN, or at least one ShortTermListing owned.
 */
export async function requireBnhubHostAccess(userId: string | null): Promise<BnhubHostAccess> {
  if (!userId) return { ok: false, status: 401, error: "Sign in required" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, _count: { select: { shortTermListings: true } } },
  });
  if (!user) return { ok: false, status: 401, error: "Sign in required" };

  const isHostish =
    user.role === PlatformRole.HOST ||
    user.role === PlatformRole.ADMIN ||
    user._count.shortTermListings > 0;

  if (!isHostish) return { ok: false, status: 403, error: "Host access required" };

  return { ok: true, userId };
}

/** Ensure listing exists and is owned by host (404 to avoid leaking ids). */
export async function assertHostOwnsListing(hostId: string, listingId: string) {
  const row = await prisma.shortTermListing.findFirst({
    where: { id: listingId, ownerId: hostId },
    select: { id: true },
  });
  return Boolean(row);
}
