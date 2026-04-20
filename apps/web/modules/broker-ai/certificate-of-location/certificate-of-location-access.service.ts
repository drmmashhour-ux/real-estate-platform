/**
 * Listing read access for certificate helper — coarse checks only.
 */

import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertBrokerResidentialFsboListing } from "@/lib/broker/residential-fsbo-scope";

const ADMIN_LISTING_ROLES: PlatformRole[] = [
  "ADMIN",
  "CONTENT_OPERATOR",
  "LISTING_OPERATOR",
  "OUTREACH_OPERATOR",
  "SUPPORT_AGENT",
];

export type CertificateListingAccess =
  | { ok: true; listingId: string }
  | { ok: false; status: number; error: string };

export async function assertCertificateOfLocationListingAccess(params: {
  userId: string | null;
  role: PlatformRole | null | undefined;
  listingId: string;
}): Promise<CertificateListingAccess> {
  const lid = typeof params.listingId === "string" ? params.listingId.trim() : "";
  if (!params.userId) return { ok: false, status: 401, error: "Sign in required." };
  if (!lid) return { ok: false, status: 400, error: "listingId is required." };

  try {
    const role = params.role ?? null;
    if (role && ADMIN_LISTING_ROLES.includes(role)) {
      const row = await prisma.fsboListing.findFirst({
        where: { id: lid },
        select: { id: true },
      });
      if (!row) return { ok: false, status: 404, error: "Listing not found." };
      return { ok: true, listingId: lid };
    }

    const brokerScoped = await assertBrokerResidentialFsboListing({
      brokerId: params.userId,
      listingId: lid,
      role: role ?? "USER",
    });
    if (brokerScoped) return { ok: true, listingId: lid };

    const owned = await prisma.fsboListing.findFirst({
      where: { id: lid, ownerId: params.userId },
      select: { id: true },
    });
    if (owned) return { ok: true, listingId: lid };

    return { ok: false, status: 403, error: "Forbidden for this listing." };
  } catch {
    return { ok: false, status: 403, error: "Forbidden for this listing." };
  }
}
