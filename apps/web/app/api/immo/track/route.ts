import { NextRequest, NextResponse } from "next/server";
import { ImmoContactEventType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { logImmoContactEvent } from "@/lib/immo/immo-contact-log";
import type { ImmoContactChannel, ImmoContactSourceHub } from "@/modules/legal/immo-contact-policy";

export const dynamic = "force-dynamic";

const ALLOWED = new Set<string>(Object.values(ImmoContactEventType));

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const rl = checkRateLimit(`immo-track:${ip}`, { windowMs: 60_000, max: 120 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  let body: {
    listingId?: unknown;
    listingKind?: unknown;
    contactType?: unknown;
    metadata?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim().slice(0, 128) : "";
  const listingKindRaw = typeof body.listingKind === "string" ? body.listingKind.trim().toLowerCase() : "";
  const listingKind = listingKindRaw === "crm" || listingKindRaw === "bnhub" ? listingKindRaw : "fsbo";
  const contactTypeRaw = typeof body.contactType === "string" ? body.contactType.trim() : "";
  if (!listingId || !ALLOWED.has(contactTypeRaw)) {
    return NextResponse.json({ error: "listingId and valid contactType required" }, { status: 400 });
  }

  const userId = await getGuestId();
  const metadata =
    body.metadata && typeof body.metadata === "object" && body.metadata !== null
      ? (body.metadata as Record<string, unknown>)
      : undefined;

  const hubRaw = metadata && typeof metadata.sourceHub === "string" ? metadata.sourceHub : "";
  const sourceHub: ImmoContactSourceHub =
    hubRaw === "seller" ||
    hubRaw === "broker" ||
    hubRaw === "bnhub_guest" ||
    hubRaw === "bnhub_host" ||
    hubRaw === "landlord" ||
    hubRaw === "tenant" ||
    hubRaw === "mortgage" ||
    hubRaw === "admin" ||
    hubRaw === "system"
      ? hubRaw
      : "buyer";

  const channelByType: Record<ImmoContactEventType, ImmoContactChannel> = {
    VIEW: "view",
    CONTACT_CLICK: "contact_click",
    MESSAGE: "message",
    CALL: "call",
    BOOKING_REQUEST: "booking_request",
    DEAL_STARTED: "deal",
    CONTACT_FORM_SUBMITTED: "form",
    CONVERSATION_STARTED: "chat",
    OFFER_STARTED: "api",
    DEAL_LINKED: "deal",
  };

  await logImmoContactEvent({
    userId,
    listingId,
    listingKind,
    contactType: contactTypeRaw as ImmoContactEventType,
    metadata: { ...metadata, path: "client_beacon" },
    policy: {
      sourceHub,
      channel: channelByType[contactTypeRaw as ImmoContactEventType],
      semantic: contactTypeRaw === "VIEW" ? "first_listing_view" : contactTypeRaw === "CONTACT_CLICK" ? "contact_button_click" : undefined,
    },
  });

  return NextResponse.json({ ok: true }, { headers: getRateLimitHeaders(rl) });
}
