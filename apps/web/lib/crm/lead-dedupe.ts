/**
 * CRM lead integrity — reduce duplicate submits (double-click, retries) for listing-scoped leads.
 */

import { prisma } from "@/lib/db";

const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Same listing + same email within the window → treat as duplicate (idempotent).
 */
export async function findRecentListingLeadDuplicate(params: {
  listingId: string;
  email: string;
  windowMs?: number;
}) {
  const windowMs = params.windowMs ?? DEFAULT_WINDOW_MS;
  const since = new Date(Date.now() - windowMs);
  const email = params.email.trim();
  if (!email) return null;
  return prisma.lead.findFirst({
    where: {
      listingId: params.listingId,
      email: { equals: email, mode: "insensitive" },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
}
