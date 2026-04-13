import { NextRequest, NextResponse } from "next/server";
import type { LecipmBrokerThreadStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getRequestIp, resolveThreadViewerFromRequest } from "@/lib/messages/api-context";
import { createLecipmBrokerThread } from "@/lib/messages/create-thread";
import { listLecipmBrokerThreads } from "@/lib/messages/list-threads";
import { parseThreadSource } from "@/lib/messages/validators";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const userId = await getGuestId();

  const rlKey = userId ? `lecipm:thread:create:user:${userId}` : `lecipm:thread:create:ip:${ip}`;
  const limit = checkRateLimit(rlKey, { windowMs: 60_000, max: userId ? 20 : 5 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(limit) }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const honeypot = typeof body.website === "string" ? body.website : "";
  if (honeypot.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const src = parseThreadSource(body.source);
  if (!src.ok) return NextResponse.json({ error: src.error }, { status: 400 });

  const listingId = typeof body.listingId === "string" ? body.listingId : null;
  const brokerUserId = typeof body.brokerUserId === "string" ? body.brokerUserId : null;
  const subject = typeof body.subject === "string" ? body.subject : null;
  const messageBody: unknown = body.body;
  const guestName = typeof body.guestName === "string" ? body.guestName : null;
  const guestEmail = typeof body.guestEmail === "string" ? body.guestEmail : null;

  const result = await createLecipmBrokerThread({
    listingId,
    brokerUserId,
    source: src.source,
    subject,
    body: messageBody,
    customerUserId: userId,
    guestName,
    guestEmail,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({
    threadId: result.threadId,
    guestToken: result.guestToken ?? null,
    leadId: result.leadId,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const guestToken = searchParams.get("guestToken");
  const resolved = await resolveThreadViewerFromRequest(request, guestToken);
  if (!resolved.viewer) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  if (resolved.viewer.kind === "guest") {
    return NextResponse.json({ error: "Sign in to view your inbox" }, { status: 401 });
  }

  const status = (searchParams.get("status") ?? "all") as LecipmBrokerThreadStatus | "all";
  const unreadOnly = searchParams.get("unread") === "1" || searchParams.get("unread") === "true";
  const listingId = searchParams.get("listingId");

  const rows = await listLecipmBrokerThreads(resolved.viewer, {
    status,
    unreadOnly,
    listingId: listingId || null,
  });

  return NextResponse.json({ threads: rows });
}
