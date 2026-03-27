import { createElement } from "react";
import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  assertListingMarketingAccess,
  MarketingAuthError,
} from "@/src/modules/bnhub-marketing/services/marketingAccess";
import { BnhubListingBrochureDocument } from "@/lib/pdf/bnhub-listing-brochure-pdf";

export const dynamic = "force-dynamic";

/** GET ?listingId= — host or admin; returns application/pdf */
export async function GET(request: NextRequest) {
  try {
    const userId = await getGuestId();
    const listingId = request.nextUrl.searchParams.get("listingId");
    if (!listingId) return Response.json({ error: "listingId required" }, { status: 400 });
    await assertListingMarketingAccess(userId, listingId);

    const l = await prisma.shortTermListing.findUniqueOrThrow({
      where: { id: listingId },
      select: {
        title: true,
        city: true,
        listingCode: true,
        nightPriceCents: true,
        maxGuests: true,
        beds: true,
        baths: true,
        description: true,
        photos: true,
        amenities: true,
      },
    });
    const photos = Array.isArray(l.photos) ? l.photos.filter((p): p is string => typeof p === "string") : [];
    const am = Array.isArray(l.amenities)
      ? l.amenities.filter((x): x is string => typeof x === "string")
      : [];
    const origin =
      request.headers.get("x-forwarded-host") && request.headers.get("x-forwarded-proto")
        ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
        : process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";
    const path = l.listingCode ? `/bnhub/${l.listingCode}` : `/bnhub/listings/${listingId}`;
    const doc = createElement(BnhubListingBrochureDocument, {
      title: l.title,
      city: l.city,
      listingCode: l.listingCode,
      nightPriceCents: l.nightPriceCents,
      maxGuests: l.maxGuests,
      beds: l.beds,
      baths: l.baths,
      description: l.description,
      heroImageUrl: photos[0] ?? null,
      amenitiesLine: am.slice(0, 12).join(", "),
      ctaUrl: `${origin.replace(/\/$/, "")}${path}`,
    });
    const buf = await renderToBuffer(doc);
    const safeName = `${l.listingCode ?? listingId}-bnhub-brochure.pdf`.replace(/[^a-zA-Z0-9._-]/g, "_");
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}"`,
      },
    });
  } catch (e) {
    if (e instanceof MarketingAuthError) {
      const status = e.code === "UNAUTHORIZED" ? 401 : e.code === "NOT_FOUND" ? 404 : 403;
      return Response.json({ error: e.message }, { status });
    }
    console.error(e);
    return Response.json({ error: "Failed to render PDF" }, { status: 500 });
  }
}
