import { AiSuggestionStatus, AiSuggestionType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const row = await prisma.aiSuggestion.findUnique({
    where: { id },
    include: { listing: true },
  });
  if (!row || row.hostId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (!row.listingId || !row.listing) {
    return Response.json({ error: "Suggestion has no listing" }, { status: 400 });
  }
  if (row.listing.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = (row.payload ?? {}) as { suggested?: number; nightPriceCents?: number };

  if (row.type === AiSuggestionType.PRICE_INCREASE || row.type === AiSuggestionType.PRICE_DECREASE) {
    const cents =
      typeof payload.nightPriceCents === "number"
        ? Math.round(payload.nightPriceCents)
        : typeof payload.suggested === "number"
          ? Math.round(payload.suggested * 100)
          : null;
    if (cents == null || cents < 0) {
      return Response.json({ error: "Invalid price payload" }, { status: 400 });
    }
    await prisma.shortTermListing.update({
      where: { id: row.listingId },
      data: { nightPriceCents: cents },
    });
  }
  // Non-price suggestions: mark applied after host acknowledges (no automated edit).

  await prisma.aiSuggestion.update({
    where: { id },
    data: { status: AiSuggestionStatus.APPLIED },
  });

  return Response.json({ ok: true });
}
