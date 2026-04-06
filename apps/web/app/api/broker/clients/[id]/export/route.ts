import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getBrokerClientDetailForPage } from "@/modules/crm/services/get-client-detail";
import { buildBrandedDocumentHtml, asDate, asText, renderBulletList, renderKeyValueRows } from "@/lib/export/branded-document-html";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, name: true, email: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const bundle = await getBrokerClientDetailForPage(id, user);
  if (!bundle.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { client, related } = bundle;
  const html = buildBrandedDocumentHtml({
    title: `${client.fullName} · Broker client dossier`,
    subtitle: [client.email, client.phone].filter(Boolean).join(" · ") || "Broker CRM client export",
    badge: client.status,
    sections: [
      {
        title: "Client profile",
        bodyHtml: renderKeyValueRows([
          { label: "Source", value: asText(client.source) },
          { label: "Target city", value: asText(client.targetCity) },
          {
            label: "Budget",
            value:
              client.budgetMin != null || client.budgetMax != null
                ? `${client.budgetMin != null ? `$${client.budgetMin.toLocaleString()}` : "—"} - ${client.budgetMax != null ? `$${client.budgetMax.toLocaleString()}` : "—"}`
                : "—",
          },
          { label: "Linked user", value: asText(client.linkedUser?.name ?? client.linkedUser?.email) },
        ]),
      },
      {
        title: "Notes and tags",
        bodyHtml: renderBulletList(
          [
            client.notes ? `Notes: ${client.notes}` : null,
            client.tags?.length ? `Tags: ${client.tags.join(", ")}` : null,
          ].filter((value): value is string => Boolean(value))
        ),
      },
      {
        title: "Timeline snapshot",
        bodyHtml: renderBulletList(
          client.interactions.slice(0, 12).map((interaction) => {
            const kind = asText(interaction.type);
            const summary = asText(interaction.title ?? interaction.message ?? "");
            return `${kind} · ${asDate(interaction.createdAt)}${summary !== "—" ? ` — ${summary}` : ""}`;
          })
        ),
      },
      {
        title: "Linked listings and records",
        bodyHtml: renderBulletList([
          ...client.listingLinks.slice(0, 12).map((link) => {
            const label = link.listingTitle ?? link.listingId;
            return `${label} · linked ${asDate(link.createdAt)}`;
          }),
          `Offers on file: ${related.offers.length}`,
          `Contracts on file: ${related.contracts.length}`,
        ]),
      },
    ],
    footerNote: "Broker dossier export generated from CRM detail view. Use browser Print > Save as PDF for sharing or archival.",
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="broker-client-dossier-${client.id.slice(0, 8)}.html"`,
    },
  });
}
