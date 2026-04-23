import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { normalizeAnyPublicListingCode } from "@/lib/listing-code-public";
import { buildBnhubStaySeoSlug, buildFsboPublicListingPath } from "@/lib/seo/public-urls";

export const dynamic = "force-dynamic";

/**
 * GET /api/listings/resolve-code?code=LST-XXXXXX|LEC-#####
 * Returns a canonical public URL for the listing, or 404.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("code")?.trim() ?? "";
  const code = normalizeAnyPublicListingCode(raw);
  if (!code) {
    return NextResponse.json({ error: "Invalid listing code" }, { status: 400 });
  }

  const [st, crm, fsbo] = await Promise.all([
    prisma.shortTermListing.findFirst({
      where: { listingCode: { equals: code, mode: "insensitive" } },
      select: { id: true, city: true, propertyType: true },
    }),
    prisma.listing.findFirst({
      where: { listingCode: { equals: code, mode: "insensitive" } },
      select: { id: true },
    }),
    prisma.fsboListing.findFirst({
      where: { listingCode: { equals: code, mode: "insensitive" } },
      select: { id: true, city: true, propertyType: true },
    }),
  ]);

  if (st) {
    const slug = buildBnhubStaySeoSlug({
      id: st.id,
      city: st.city,
      propertyType: st.propertyType,
    });
    return NextResponse.json({ kind: "bnhub", id: st.id, url: `/stays/${encodeURIComponent(slug)}` });
  }
  if (fsbo) {
    return NextResponse.json({
      kind: "fsbo",
      id: fsbo.id,
      url: buildFsboPublicListingPath(fsbo),
    });
  }
  if (crm) {
    return NextResponse.json({
      kind: "crm",
      id: crm.id,
      url: `/dashboard/listings/${encodeURIComponent(crm.id)}`,
      requiresAuth: true,
    });
  }

  return NextResponse.json({ error: "Listing not found" }, { status: 404 });
}
