import { NextResponse } from "next/server";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { prisma } from "@repo/db";
import { recordContentMetrics } from "@/lib/content-machine/pipeline";

export const dynamic = "force-dynamic";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Public: increment views / clicks / conversions for a machine-generated content piece.
 * Requires `contentId` to belong to `listingId` (prevents cross-listing spam).
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = checkRateLimit(`content-machine:perf:${ip}`, { windowMs: 60_000, max: 120 });
  if (!limit.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: getRateLimitHeaders(limit) });
  }

  const body = (await req.json().catch(() => ({}))) as {
    contentId?: unknown;
    listingId?: unknown;
    event?: unknown;
  };
  const contentId = typeof body.contentId === "string" ? body.contentId.trim() : "";
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const event = body.event;
  if (
    !contentId ||
    !listingId ||
    (event !== "view" && event !== "click" && event !== "conversion")
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const row = await prisma.machineGeneratedContent.findFirst({
    where: { id: contentId, listingId },
    select: { id: true },
  });
  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await recordContentMetrics(contentId, {
    views: event === "view" ? 1 : undefined,
    clicks: event === "click" ? 1 : undefined,
    conversions: event === "conversion" ? 1 : undefined,
  });

  return NextResponse.json({ ok: true }, { headers: getRateLimitHeaders(limit) });
}
