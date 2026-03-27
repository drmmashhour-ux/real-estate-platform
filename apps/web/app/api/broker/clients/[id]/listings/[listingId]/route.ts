import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canManageBrokerClient } from "@/modules/crm/services/broker-crm-permissions";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; listingId: string }> };

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;
  const { id, listingId } = await ctx.params;

  const client = await prisma.brokerClient.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageBrokerClient(session, client)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.brokerClientListing.deleteMany({
    where: { brokerClientId: id, listingId },
  });

  return NextResponse.json({ ok: true });
}
