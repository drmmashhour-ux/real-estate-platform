import { NextRequest, NextResponse } from "next/server";
import type { BrokerClientListingKind } from "@prisma/client";
import { prisma } from "@repo/db";
import { canManageBrokerClient } from "@/modules/crm/services/broker-crm-permissions";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

const KINDS: BrokerClientListingKind[] = ["SAVED", "SHARED", "VIEWED", "FAVORITE"];

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const { id } = await ctx.params;

  const client = await prisma.brokerClient.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageBrokerClient(session, client)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 });

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 400 });

  let kind: BrokerClientListingKind = "SAVED";
  if (typeof body.kind === "string" && body.kind.trim()) {
    const k = body.kind.trim().toUpperCase() as BrokerClientListingKind;
    if (!KINDS.includes(k)) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    kind = k;
  }

  const link = await prisma.brokerClientListing.upsert({
    where: {
      brokerClientId_listingId: { brokerClientId: id, listingId },
    },
    create: {
      brokerClientId: id,
      listingId,
      kind,
    },
    update: { kind },
  });

  return NextResponse.json({ ok: true, link });
}
