import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/**
 * POST — BNHUB / marketplace click attribution (CTAs, cards, chips).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    targetType?: unknown;
    targetUrl?: unknown;
    listingId?: unknown;
    anonymousId?: unknown;
    meta?: unknown;
  };

  const targetType = typeof body.targetType === "string" ? body.targetType.trim().slice(0, 64) : "";
  if (!targetType) {
    return Response.json({ error: "targetType required" }, { status: 400 });
  }

  const user = await getMobileAuthUser(request);
  const anonymousId =
    typeof body.anonymousId === "string" ? body.anonymousId.trim().slice(0, 64) : null;
  if (!user && !anonymousId) {
    return Response.json({ error: "Sign in or pass anonymousId" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim().slice(0, 80) : null;
  const targetUrl = typeof body.targetUrl === "string" ? body.targetUrl.trim().slice(0, 4000) : null;

  await prisma.bnhubClientClickEvent.create({
    data: {
      userId: user?.id ?? null,
      anonymousId,
      targetType,
      targetUrl,
      supabaseListingId: listingId,
      metaJson: body.meta && typeof body.meta === "object" ? body.meta : undefined,
    },
  });

  return Response.json({ ok: true });
}
