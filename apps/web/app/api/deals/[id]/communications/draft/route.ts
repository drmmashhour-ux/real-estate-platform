import { RequestCommunicationChannel, RequestCommunicationDirection } from "@prisma/client";
import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canMutateCoordination, loadDealForCoordination } from "@/lib/deals/coordination-access";
import { coordinationFlags } from "@/lib/deals/coordination-feature-flags";
import { createAutoDraftFromRequest, createCommunicationDraft } from "@/modules/request-communications/request-communications.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const gate = await loadDealForCoordination(dealId, userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });
  if (!canMutateCoordination(gate)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const flags = await coordinationFlags();
  if (!flags.requestCommunicationsV1) return Response.json({ error: "Disabled" }, { status: 403 });

  let body: {
    dealRequestId?: string;
    autoFromRequest?: boolean;
    channel?: RequestCommunicationChannel;
    direction?: RequestCommunicationDirection;
    subject?: string;
    body?: string;
    metadata?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.autoFromRequest && body.dealRequestId) {
    const row = await createAutoDraftFromRequest(dealId, body.dealRequestId, userId);
    if (!row) return Response.json({ error: "Request not found" }, { status: 404 });
    return Response.json({ communication: row });
  }

  if (!body.dealRequestId || !body.channel || !body.direction) {
    return Response.json({ error: "dealRequestId, channel, direction required" }, { status: 400 });
  }

  const row = await createCommunicationDraft(
    dealId,
    {
      dealRequestId: body.dealRequestId,
      channel: body.channel,
      direction: body.direction,
      subject: body.subject,
      body: body.body,
      metadata: body.metadata,
    },
    userId
  );
  if (!row) return Response.json({ error: "Request not found" }, { status: 404 });
  return Response.json({ communication: row });
}
