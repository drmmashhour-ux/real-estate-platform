import { NextResponse } from "next/server";
import { gateDistributedRateLimit } from "@/lib/rate-limit-enforcement";
import { getGuestId } from "@/lib/auth/session";
import { startMarketplaceThreadFromListing } from "@/lib/messages/start-marketplace-thread";

export const dynamic = "force-dynamic";

/**
 * One-click marketplace thread: Conversation + intro message + CRM lead (status new).
 * Body: { listingId: string, listingKind: "crm" | "fsbo", listingUrl?: string }
 */
export async function POST(req: Request) {
  const gate = await gateDistributedRateLimit(req as Request, "messages:start-from-listing", {
    windowMs: 60_000,
    max: 8,
  });
  if (!gate.allowed) return gate.response;

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const listingId = typeof o.listingId === "string" ? o.listingId.trim() : "";
  const listingKind = o.listingKind === "fsbo" ? "fsbo" : "crm";
  const listingUrl = typeof o.listingUrl === "string" ? o.listingUrl.trim() : "";

  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const result = await startMarketplaceThreadFromListing({
    userId,
    listingKind,
    listingId,
    listingUrl: listingUrl || new URL(req.url).origin,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code, priceCents: result.priceCents },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    conversationId: result.conversationId,
    leadId: result.leadId,
    createdConversation: result.createdConversation,
  });
}
