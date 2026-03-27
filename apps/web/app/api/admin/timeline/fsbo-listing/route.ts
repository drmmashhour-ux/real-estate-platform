import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type TimelineRow = {
  sortAt: Date;
  source: string;
  label: string;
  detail: Record<string, unknown>;
};

/**
 * Admin: unified chronological timeline for an FSBO listing (audit / disputes).
 * Timestamps are stored in UTC; clients should render in the viewer's local timezone.
 */
export async function GET(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const listingId = (new URL(request.url).searchParams.get("listingId") ?? "").trim();
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const orderParam = (new URL(request.url).searchParams.get("order") ?? "desc").toLowerCase();
  const orderDir = orderParam === "asc" ? "asc" : "desc";

  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      listingCode: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      ownerId: true,
    },
  });

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const [immoLogs, leads, contracts] = await Promise.all([
    prisma.immoContactLog.findMany({
      where: {
        listingId,
        OR: [{ listingKind: "fsbo" }, { listingKind: null }],
      },
      orderBy: { actionAt: orderDir },
      take: 500,
      select: {
        id: true,
        contactType: true,
        userId: true,
        listingKind: true,
        metadata: true,
        createdAt: true,
        actionAt: true,
        adminNote: true,
        adminNotedAt: true,
      },
    }),
    prisma.lead.findMany({
      where: { fsboListingId: listingId },
      orderBy: { createdAt: orderDir },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        contactOrigin: true,
        firstPlatformContactAt: true,
      },
    }),
    prisma.contract.findMany({
      where: { fsboListingId: listingId },
      orderBy: { createdAt: orderDir },
      take: 100,
      select: {
        id: true,
        type: true,
        status: true,
        signed: true,
        signedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const rows: TimelineRow[] = [];

  rows.push({
    sortAt: listing.createdAt,
    source: "fsbo_listing",
    label: "Listing created",
    detail: { listingId: listing.id, listingCode: listing.listingCode, status: listing.status },
  });
  if (listing.updatedAt.getTime() !== listing.createdAt.getTime()) {
    rows.push({
      sortAt: listing.updatedAt,
      source: "fsbo_listing",
      label: "Listing updated",
      detail: { listingId: listing.id },
    });
  }

  for (const log of immoLogs) {
    rows.push({
      sortAt: log.actionAt,
      source: "immo_contact_log",
      label: `ImmoContact: ${log.contactType}`,
      detail: {
        id: log.id,
        eventType: log.contactType,
        userId: log.userId,
        metadata: log.metadata,
        adminNote: log.adminNote,
        adminNotedAt: log.adminNotedAt,
        createdAt: log.createdAt,
        actionAt: log.actionAt,
      },
    });
  }

  for (const lead of leads) {
    rows.push({
      sortAt: lead.createdAt,
      source: "lead",
      label: `Lead recorded (${lead.status})`,
      detail: {
        leadId: lead.id,
        name: lead.name,
        email: lead.email,
        contactOrigin: lead.contactOrigin,
        firstPlatformContactAt: lead.firstPlatformContactAt,
      },
    });
    if (lead.updatedAt.getTime() !== lead.createdAt.getTime()) {
      rows.push({
        sortAt: lead.updatedAt,
        source: "lead",
        label: "Lead updated",
        detail: { leadId: lead.id, status: lead.status },
      });
    }
  }

  for (const c of contracts) {
    rows.push({
      sortAt: c.createdAt,
      source: "contract",
      label: `Contract ${c.type} (${c.status})`,
      detail: {
        contractId: c.id,
        signed: c.signed,
        signedAt: c.signedAt,
      },
    });
    if (c.signedAt) {
      rows.push({
        sortAt: c.signedAt,
        source: "contract",
        label: "Contract signed",
        detail: { contractId: c.id },
      });
    }
  }

  rows.sort((a, b) => (orderDir === "desc" ? b.sortAt.getTime() - a.sortAt.getTime() : a.sortAt.getTime() - b.sortAt.getTime()));

  return NextResponse.json({
    listing,
    order: orderDir,
    timeline: rows.map((r) => ({
      ...r,
      sortAt: r.sortAt.toISOString(),
    })),
  });
}
