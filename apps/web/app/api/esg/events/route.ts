import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { appendEsgEvent, syncEsgScoreForListing, userCanManageListingListing } from "@/modules/esg/esg.service";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const TAG = "[esg]";

/** GET — timeline */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const ok = await userCanManageListingListing(userId, listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const events = await prisma.esgEvent.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  logInfo(`${TAG} events.list`, { listingId, count: events.length });
  return NextResponse.json({ listingId, events });
}

/** POST — log improvement / risk (optional score refresh) */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    listingId?: string;
    type?: string;
    message?: string;
    scoreImpact?: number;
  };

  if (!body.listingId || !body.type || !body.message || body.scoreImpact === undefined) {
    return NextResponse.json({ error: "listingId, type, message, scoreImpact required" }, { status: 400 });
  }

  const ok = await userCanManageListingListing(userId, body.listingId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const t = body.type.toUpperCase();
  if (t !== "IMPROVEMENT" && t !== "RISK") {
    return NextResponse.json({ error: "type must be IMPROVEMENT or RISK" }, { status: 400 });
  }

  await appendEsgEvent(body.listingId, {
    type: t as "IMPROVEMENT" | "RISK",
    message: body.message,
    scoreImpact: Number(body.scoreImpact),
  });
  await syncEsgScoreForListing(body.listingId);

  logInfo(`${TAG} events.create`, { listingId: body.listingId, type: t });
  return NextResponse.json({ ok: true });
}
