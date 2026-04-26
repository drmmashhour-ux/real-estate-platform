import { NextResponse } from "next/server";
import { ShareSessionStatus } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { createShareSession } from "@/lib/share-my-stay/create-session";
import { expireSessionIfNeeded } from "@/lib/share-sessions/session-lifecycle";

export const dynamic = "force-dynamic";

/** Guest: list active-ish session for a booking (no raw token). */
export async function GET(request: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookingId = new URL(request.url).searchParams.get("bookingId")?.trim();
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true },
  });
  if (!booking || booking.guestId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await prisma.shareSession.findFirst({
    where: { bookingId, guestUserId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      recipients: { take: 1, orderBy: { createdAt: "asc" } },
    },
  });
  if (!row) return NextResponse.json({ session: null });

  const status = await expireSessionIfNeeded(row);
  if (status !== ShareSessionStatus.ACTIVE && status !== ShareSessionStatus.PAUSED) {
    return NextResponse.json({ session: null });
  }

  return NextResponse.json({
    session: {
      id: row.id,
      status,
      shareType: row.shareType,
      expiresAt: row.expiresAt.toISOString(),
      startedAt: row.startedAt.toISOString(),
      displayLabel: row.recipients[0]?.displayLabel ?? null,
      recipientType: row.recipients[0]?.recipientType ?? null,
      lastLocationAt: row.lastLocationAt?.toISOString() ?? null,
      shareUrlHint:
        "Copy the link from this browser after you start sharing, or start a new session if you cleared storage.",
    },
  });
}

export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await createShareSession({ guestUserId: userId, body });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    sessionId: result.sessionId,
    token: result.rawToken,
    shareUrl: result.shareUrl,
    expiresAt: result.expiresAtIso,
    warning: result.warning,
  });
}
