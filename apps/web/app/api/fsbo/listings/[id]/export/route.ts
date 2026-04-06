import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getSellHubLegalChecklist } from "@/lib/fsbo/sell-hub-legal-checklist";
import { getListingTransactionFlag } from "@/lib/fsbo/listing-transaction-flag";
import { buildBrandedDocumentHtml, asDate, asText, renderBulletList, renderKeyValueRows } from "@/lib/export/branded-document-html";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const [user, listing, checklist, transactionFlag] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.fsboListing.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        title: true,
        city: true,
        listingCode: true,
        status: true,
        expiresAt: true,
        archivedAt: true,
        listingOwnerType: true,
      },
    }),
    getSellHubLegalChecklist(id),
    getListingTransactionFlag(id),
  ]);

  if (!listing || !checklist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const allowed = listing.ownerId === userId || user?.role === "ADMIN";
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = checklist.items.map((item) => `${item.label}: ${item.status.toUpperCase()}${item.detail ? ` — ${item.detail}` : ""}`);
  const html = buildBrandedDocumentHtml({
    title: checklist.title,
    subtitle: `${listing.city} · Seller legal packet`,
    badge: transactionFlag?.label ?? listing.status,
    sections: [
      {
        title: "Listing overview",
        bodyHtml: renderKeyValueRows([
          { label: "Listing code", value: asText(listing.listingCode) },
          { label: "Status", value: asText(listing.status) },
          { label: "Owner type", value: asText(listing.listingOwnerType) },
          { label: "Expiry", value: asDate(listing.expiresAt) },
          { label: "Archived at", value: asDate(listing.archivedAt) },
        ]),
      },
      {
        title: "Legal readiness",
        bodyHtml: renderKeyValueRows([
          { label: "Publish ready", value: checklist.publishReady ? "YES" : "NO" },
          { label: "Owner", value: asText(checklist.ownerName) },
          { label: "Owner email", value: asText(checklist.ownerEmail) },
          {
            label: "Broker authority",
            value: checklist.ownerType === "BROKER"
              ? asText(
                  checklist.brokerCompany
                    ? `${checklist.brokerCompany}${checklist.brokerLicenseNumber ? ` · ${checklist.brokerLicenseNumber}` : ""}`
                    : checklist.brokerLicenseNumber
                )
              : "Owner-direct listing",
          },
        ]),
      },
      {
        title: "Checklist items",
        bodyHtml: renderBulletList(items),
      },
      {
        title: "Risk alerts",
        bodyHtml: renderBulletList(
          checklist.riskAlerts.length > 0
            ? checklist.riskAlerts.map((alert) => `${alert.severity}: ${alert.message}`)
            : ["No additional risk alerts were attached to this export at generation time."]
        ),
      },
    ],
    footerNote: "Seller export generated from Sell Hub legal controls. Use browser Print > Save as PDF to keep a branded packet.",
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="seller-legal-packet-${listing.id.slice(0, 8)}.html"`,
    },
  });
}
