import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getSellHubLegalChecklist } from "@/lib/fsbo/sell-hub-legal-checklist";
import { getListingTransactionFlag } from "@/lib/fsbo/listing-transaction-flag";
import { buildBrandedDocumentHtml, asText, renderBulletList, renderKeyValueRows } from "@/lib/export/branded-document-html";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [checklist, listing, transactionFlag] = await Promise.all([
    getSellHubLegalChecklist(id),
    prisma.fsboListing.findUnique({
      where: { id },
      select: {
        id: true,
        moderationStatus: true,
        status: true,
        trustScore: true,
        listingOwnerType: true,
      },
    }),
    getListingTransactionFlag(id),
  ]);

  if (!checklist || !listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const html = buildBrandedDocumentHtml({
    title: `${checklist.title} · Admin compliance review`,
    subtitle: `${checklist.ownerName ?? "Unknown owner"} · ${checklist.ownerEmail}`,
    badge: transactionFlag?.label ?? listing.status,
    sections: [
      {
        title: "Control summary",
        bodyHtml: renderKeyValueRows([
          { label: "Listing ID", value: checklist.listingId },
          { label: "Listing code", value: asText(checklist.listingCode) },
          { label: "Status", value: listing.status },
          { label: "Moderation", value: listing.moderationStatus },
          { label: "Owner type", value: listing.listingOwnerType },
          { label: "Trust score", value: asText(listing.trustScore) },
        ]),
      },
      {
        title: "Admin legal checklist",
        bodyHtml: renderBulletList(
          checklist.items.map(
            (item) => `${item.label}: ${item.status.toUpperCase()}${item.detail ? ` — ${item.detail}` : ""}`
          )
        ),
      },
      {
        title: "Evidence and risk",
        bodyHtml:
          renderBulletList(
            [
              checklist.supportingSummary.total > 0
                ? `${checklist.supportingSummary.approved} approved · ${checklist.supportingSummary.pending} pending · ${checklist.supportingSummary.rejected} rejected supporting documents.`
                : "No supporting documents attached.",
              ...checklist.riskAlerts.map((alert) => `${alert.severity}: ${alert.message}`),
            ].filter((value): value is string => Boolean(value))
          ),
      },
    ],
    footerNote: "Admin compliance export generated from Sell Hub controls for internal legal and moderation review.",
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="admin-compliance-review-${listing.id.slice(0, 8)}.html"`,
    },
  });
}
