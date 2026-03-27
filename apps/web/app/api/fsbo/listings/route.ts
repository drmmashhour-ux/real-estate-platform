import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { fsboCityWhereFromParam } from "@/lib/geo/city-search";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { parseSessionUserId, TENANT_CONTEXT_COOKIE_NAME } from "@/lib/auth/session-cookie";
import {
  parseFsboListingBody,
  toFsboCreateData,
} from "@/lib/fsbo/validation";
import { allocateUniqueLSTListingCode } from "@/lib/listing-code";
import { ensureSellerContractsForFsboListing } from "@/lib/contracts/fsbo-seller-contracts";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";
import { syncTrustGraphForFsboListing } from "@/lib/trustgraph/integration/fsboListing";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";

export const dynamic = "force-dynamic";

/** GET — public catalog (active + approved only) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim();
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const bedrooms = searchParams.get("bedrooms");

  const and: Prisma.FsboListingWhereInput[] = [
    { status: "ACTIVE" },
    { moderationStatus: "APPROVED" },
  ];

  if (city) {
    and.push(fsboCityWhereFromParam(city));
  }
  if (minPrice) {
    const n = parseInt(minPrice, 10);
    if (Number.isFinite(n) && n >= 0) and.push({ priceCents: { gte: n * 100 } });
  }
  if (maxPrice) {
    const n = parseInt(maxPrice, 10);
    if (Number.isFinite(n) && n >= 0) and.push({ priceCents: { lte: n * 100 } });
  }
  if (bedrooms) {
    const n = parseInt(bedrooms, 10);
    if (Number.isFinite(n) && n >= 0) and.push({ bedrooms: { gte: n } });
  }

  const listings = await prisma.fsboListing.findMany({
    where: { AND: and },
    orderBy: { updatedAt: "desc" },
    take: 60,
    select: {
      id: true,
      listingCode: true,
      title: true,
      priceCents: true,
      city: true,
      bedrooms: true,
      bathrooms: true,
      images: true,
      coverImage: true,
      updatedAt: true,
    },
  });

  return Response.json({ listings });
}

/** POST — create draft (auth) */
export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const licenseBlock = await requireContentLicenseAccepted(userId);
  if (licenseBlock) return licenseBlock;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseFsboListingBody(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const c = await cookies();
  const tenantId = parseSessionUserId(c.get(TENANT_CONTEXT_COOKIE_NAME)?.value);

  const row = await prisma.$transaction(async (tx) => {
    const listingCode = await allocateUniqueLSTListingCode(tx);
    const listing = await tx.fsboListing.create({
      data: toFsboCreateData(userId, parsed.data, {
        tenantId: tenantId ?? undefined,
        listingCode,
      }),
    });
    await tx.fsboListingVerification.create({ data: { fsboListingId: listing.id } });
    return listing;
  });

  await ensureSellerContractsForFsboListing(row.id).catch(() => {});

  if (isTrustGraphEnabled()) {
    void syncTrustGraphForFsboListing({
      listingId: row.id,
      actorUserId: userId,
      runPipeline: true,
    }).catch(() => {});
  }

  return Response.json({ id: row.id });
}
