import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { FsboListingOwnerType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { parseSessionUserId, TENANT_CONTEXT_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { ensureSellerContractsForFsboListing } from "@/lib/contracts/fsbo-seller-contracts";
import { ensureFsboListingDocumentSlots } from "@/lib/fsbo/seller-hub-seed-documents";
import { allocateUniqueLSTListingCode } from "@/lib/listing-code";
import { isBrokerVerified } from "@/lib/verification/broker";

export const dynamic = "force-dynamic";

/**
 * POST — create a minimal FSBO draft for Seller Hub (placeholder fields; complete in wizard).
 *
 * Safe acquisition: listings must be owner/broker-submitted or operator-entered with documented permission.
 * Never auto-populate from scraped or copyrighted third-party sources — see `docs/compliance/safe-listing-acquisition.md`.
 */
export async function POST() {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, phone: true, sellerSellingMode: true },
  });
  const brokerVerified = await isBrokerVerified(userId).catch(() => false);
  const listingOwnerType: FsboListingOwnerType =
    brokerVerified &&
    (user?.sellerSellingMode === "PLATFORM_BROKER" || user?.sellerSellingMode === "PREFERRED_BROKER")
      ? "BROKER"
      : "SELLER";
  if (!user?.email) {
    return Response.json({ error: "User email required" }, { status: 400 });
  }

  const c = await cookies();
  const tenantId = parseSessionUserId(c.get(TENANT_CONTEXT_COOKIE_NAME)?.value);

  const row = await prisma.$transaction(async (tx) => {
    const listingCode = await allocateUniqueLSTListingCode(tx);
    const listing = await tx.fsboListing.create({
      data: {
        listingOwnerType,
        listingCode,
        owner: { connect: { id: userId } },
        ...(tenantId ? { tenant: { connect: { id: tenantId } } } : {}),
        title: "Draft listing",
        description:
          "Complete your listing in Seller Hub — add details, photos, seller declaration, documents, and sign contracts before submitting for review.",
        priceCents: 100_000,
        address: "TBD",
        city: "TBD",
        bedrooms: null,
        bathrooms: null,
        surfaceSqft: null,
        images: [],
        status: "DRAFT",
        moderationStatus: "APPROVED",
        contactEmail: user.email,
        contactPhone: user.phone ?? null,
        publishPlan: "basic",
      },
    });
    await tx.fsboListingVerification.create({ data: { fsboListingId: listing.id } });
    return listing;
  });

  await ensureFsboListingDocumentSlots(row.id);
  await ensureSellerContractsForFsboListing(row.id).catch(() => {});

  return Response.json({ id: row.id, listingCode: row.listingCode });
}
