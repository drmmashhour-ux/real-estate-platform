import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeAnyPublicListingCode } from "@/lib/listing-code-public";

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
      select: { id: true },
    }),
    prisma.listing.findFirst({
      where: { listingCode: { equals: code, mode: "insensitive" } },
      select: { id: true },
    }),
    prisma.fsboListing.findFirst({
      where: { listingCode: { equals: code, mode: "insensitive" } },
      select: { id: true },
    }),
  ]);

  if (st) {
    return NextResponse.json({ kind: "bnhub", id: st.id, url: `/bnhub/${encodeURIComponent(st.id)}` });
  }
  if (fsbo) {
    return NextResponse.json({ kind: "fsbo", id: fsbo.id, url: `/listings/${encodeURIComponent(fsbo.id)}` });
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
