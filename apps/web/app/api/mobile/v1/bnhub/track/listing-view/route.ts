import { refreshBnhubListingDemandScore } from "@/lib/monetization/demand-score";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/**
 * POST — record a Supabase listing view and refresh demand score (async).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    listingId?: unknown;
    source?: unknown;
    anonymousId?: unknown;
  };

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  if (!listingId) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }

  const user = await getMobileAuthUser(request);
  const anonymousId =
    typeof body.anonymousId === "string" ? body.anonymousId.trim().slice(0, 64) : null;

  if (!user && !anonymousId) {
    return Response.json({ error: "Sign in or pass anonymousId" }, { status: 400 });
  }

  await prisma.bnhubClientListingViewEvent.create({
    data: {
      userId: user?.id ?? null,
      anonymousId,
      supabaseListingId: listingId,
      source: typeof body.source === "string" ? body.source.trim().slice(0, 120) : null,
    },
  });

  void refreshBnhubListingDemandScore(listingId).catch(() => {});

  return Response.json({ ok: true });
}
