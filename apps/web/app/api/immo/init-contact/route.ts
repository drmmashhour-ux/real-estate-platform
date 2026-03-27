/**
 * POST /api/immo/init-contact — Record ImmoContact session after notice acceptance (lead + optional DM thread).
 */

import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createOrGetImmoContactSession } from "@/lib/immo/init-immo-contact";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rateKey =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "anonymous";
  const limit = checkRateLimit(`public:immo-init-contact:${rateKey}`, { windowMs: 60_000, max: 20 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

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
