/**
 * POST /api/immo/init-contact — Record ImmoContact session after notice acceptance (lead + optional DM thread).
 */

import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createOrGetImmoContactSession } from "@/lib/immo/init-immo-contact";
import { gateDistributedRateLimit } from "@/lib/rate-limit-enforcement";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gate = await gateDistributedRateLimit(req, "public:immo-init-contact", { windowMs: 60_000, max: 20 });
  if (!gate.allowed) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const collaborationNoticeAccepted = body.collaborationNoticeAccepted === true;
  const existingLeadId = typeof body.existingLeadId === "string" ? body.existingLeadId.trim() : null;

  if (!listingId) {
    return NextResponse.json({ error: "listingId is required." }, { status: 400 });
  }

  const buyerUserId = await getGuestId();

  const result = await createOrGetImmoContactSession({
    listingRef: listingId,
    buyerUserId,
    collaborationNoticeAccepted,
    existingLeadId,
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    leadId: result.leadId,
    conversationId: result.conversationId,
    duplicate: result.duplicate,
  });
}
