import { NextResponse } from "next/server";
import { buildBrandedDocumentHtml, asMoney, asText, renderBulletList, renderKeyValueRows } from "@/lib/export/branded-document-html";
import { mapCrmListingToBuyerPayload, resolvePublicListing } from "@/lib/listings/resolve-public-listing";
import { getListingTransactionFlag } from "@/lib/fsbo/listing-transaction-flag";
import { getGuestId } from "@/lib/auth/session";
import { buyerHasPaidListingContact, isListingContactPaywallEnabled } from "@/lib/leads";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const resolved = await resolvePublicListing(id);
  if (!resolved) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (resolved.kind === "fsbo") {
    const row = resolved.row;
    const flag = await getListingTransactionFlag(row.id, row.status);
    const paywall = isListingContactPaywallEnabled();
    const viewerId = await getGuestId();
    const isOwner = Boolean(viewerId && viewerId === row.ownerId);
    let revealContact = !paywall || isOwner;
    if (paywall && viewerId && !isOwner) {
      revealContact = await buyerHasPaidListingContact(viewerId, "FSBO_LISTING", row.id);
    }
    const contactEmail = revealContact ? row.contactEmail : "Unlock on listing page";
    const contactPhone = revealContact ? asText(row.contactPhone ?? row.owner.phone) : "Hidden";
    const html = buildBrandedDocumentHtml({
      title: row.title,
      subtitle: `${row.city} · ${asMoney(row.priceCents)} · Public listing brochure`,
      badge: flag?.label ?? "Sell Hub listing",
      sections: [
        {
          title: "Property summary",
          bodyHtml: renderKeyValueRows([
            { label: "Listing code", value: asText(row.listingCode) },
            { label: "City", value: asText(row.city) },
            { label: "Address", value: asText(row.address) },
            { label: "Bedrooms", value: asText(row.bedrooms) },
            { label: "Bathrooms", value: asText(row.bathrooms) },
            { label: "Owner path", value: row.listingOwnerType === "BROKER" ? "Listed with broker" : "Owner-direct" },
          ]),
        },
        {
          title: "Description",
          bodyHtml: `<p>${asText(row.description)}</p>`,
        },
        {
          title: "Representative",
          bodyHtml: renderKeyValueRows([
            { label: "Contact email", value: asText(contactEmail) },
            { label: "Contact phone", value: contactPhone },
            { label: "Owner", value: asText(row.owner.name) },
          ]),
        },
        {
          title: "Documents and visibility",
          bodyHtml: renderBulletList([
            "Use the live listing page for the most current legal and transaction details.",
            "Supporting documents and declarations remain subject to admin and broker review where applicable.",
            "Interested buyers can use platform contact workflows or work through the listing representative.",
          ]),
        },
      ],
      footerNote: "Generated from the live listing page. Use browser Print > Save as PDF for a branded brochure.",
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="listing-brochure-${row.id.slice(0, 8)}.html"`,
      },
    });
  }

  if (resolved.kind === "bnhub") {
    const html = buildBrandedDocumentHtml({
      title: resolved.slug,
      subtitle: `${resolved.city ?? "BNHub"} · ${asText(resolved.propertyType ?? "Short stay")} · Guest brochure`,
      badge: "BNHub listing",
      sections: [
        {
          title: "Listing summary",
          bodyHtml: renderKeyValueRows([
            { label: "Listing code", value: asText(resolved.slug) },
            { label: "City", value: asText(resolved.city) },
            { label: "Property type", value: asText(resolved.propertyType) },
          ]),
        },
        {
          title: "Booking and safety",
          bodyHtml: renderBulletList([
            "Use the live BNHub listing page for current photos, availability, pricing, and host verification details.",
            "Always complete booking and payment through the platform workflow to preserve auditability and guest protections.",
            "Report suspicious listing, payment, or communication behavior through the platform support and trust-safety flows.",
          ]),
        },
      ],
      footerNote: "Generated from the live BNHub listing reference. Use browser Print > Save as PDF for a branded brochure.",
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="listing-brochure-${resolved.id.slice(0, 8)}.html"`,
      },
    });
  }

  if (resolved.kind !== "crm") {
    return NextResponse.json({ error: "Unsupported listing kind" }, { status: 400 });
  }

  const row = mapCrmListingToBuyerPayload(resolved.row);
  const html = buildBrandedDocumentHtml({
    title: row.title,
    subtitle: `${row.city ?? "Marketplace"} · ${asMoney(row.priceCents)} · Buyer brochure`,
    badge: "Marketplace listing",
    sections: [
      {
        title: "Listing summary",
        bodyHtml: renderKeyValueRows([
          { label: "Listing code", value: asText(row.listingCode) },
          { label: "City", value: asText(row.city) },
          { label: "Property type", value: asText(row.propertyType) },
          { label: "Price", value: asMoney(row.priceCents) },
        ]),
      },
      {
        title: "Description",
        bodyHtml: `<p>${asText(row.description)}</p>`,
      },
    ],
    footerNote: "Generated from the marketplace listing. Use the live page to confirm availability and latest details.",
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="listing-brochure-${row.id.slice(0, 8)}.html"`,
    },
  });
}
