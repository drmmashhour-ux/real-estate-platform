import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { assertListingOwner } from "@/lib/bnhub/hospitality-addons";

export const dynamic = "force-dynamic";

/** POST — create or return ICS export feed token (host-owned listing). */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { listingId?: string };
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) return NextResponse.json({ error: "listingId is required" }, { status: 400 });

  const gate = await assertListingOwner(userId, listingId);
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  let feed = await prisma.listingIcsFeed.findUnique({
    where: { listingId },
  });

  if (!feed) {
    feed = await prisma.listingIcsFeed.create({
      data: {
        listingId,
        token: randomUUID(),
      },
    });
  }

  const origin =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string" && process.env.NEXT_PUBLIC_SITE_URL.startsWith("http")
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
      : "";

  const feedUrl = `${origin}/api/calendar/ics/${encodeURIComponent(feed.token)}`;

  return NextResponse.json({
    ...feed,
    feedUrl,
    exportPath: `/api/calendar/ics/${feed.token}`,
  });
}
