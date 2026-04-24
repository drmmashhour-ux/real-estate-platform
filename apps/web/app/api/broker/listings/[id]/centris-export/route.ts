import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canAccessCrmListingCompliance } from "@/lib/compliance/crm-listing-access";
import { prisma } from "@repo/db";
import { prepareCentrisPayload } from "@/lib/centris/prepare-centris-payload.service";

export const dynamic = "force-dynamic";

/** GET — JSON export for manual Centris portal upload (broker-only; never auto-posts). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await ctx.params;
  const ok = await canAccessCrmListingCompliance(userId, id);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { listingCode: true },
  });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  try {
    const payload = await prepareCentrisPayload({ listingId: id, brokerUserId: userId });
    const filename = `lecipm-centris-export-${listing.listingCode.replace(/[^a-zA-Z0-9-_]/g, "_")}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Export failed";
    if (msg === "LISTING_NOT_FOUND_OR_FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (msg === "CENTRIS_EXPORT_NOT_ELIGIBLE") {
      return NextResponse.json(
        {
          error:
            "Centris export requires an active broker licence and Centris access on file. Listings may remain draft until eligibility is confirmed.",
          code: "CENTRIS_EXPORT_NOT_ELIGIBLE",
        },
        { status: 403 },
      );
    }
    console.error("[centris-export]", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
