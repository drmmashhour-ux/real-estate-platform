import { z } from "zod";

import { rankListings } from "@/lib/ai/feedRanking";
import { getConversionIntentByListingId } from "@/lib/ai/conversionEngine";
import { getHostReputationsForHostIds } from "@/lib/ai/reputationEngine";
import { getUserProfile } from "@/lib/ai/userProfile";
import { FEED_WINDOW, loadFeedListingsFromDb } from "@/lib/feed/loadFeedListingsPage";
import { getGuestId } from "@/lib/auth/session";
import { flags } from "@/lib/flags";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE = 10;

function encodeCursor(o: { offset: number }): string {
  return Buffer.from(JSON.stringify(o), "utf8").toString("base64url");
}

function decodeCursor(raw: string | null): { offset: number } {
  if (!raw?.trim()) return { offset: 0 };
  try {
    const p = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as { offset?: number };
    const o = Math.max(0, Math.floor(Number(p.offset) || 0));
    return { offset: o };
  } catch {
    return { offset: 0 };
  }
}

const QueryZ = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(DEFAULT_PAGE),
  /** Comma-separated — cities to boost (session, from client). */
  boostCities: z.string().optional(),
});

/**
 * GET /api/feed/listings — paged, ranked (when recommendations on) or chronological (fallback).
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const { searchParams } = new URL(req.url);
  const parsed = QueryZ.safeParse({
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    boostCities: searchParams.get("boostCities") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "Invalid query" }, { status: 400 });
  }
  const { limit } = parsed.data;
  const sessionBoostCities = parsed.data.boostCities
    ?.split(",")
    .map((c) => c.trim())
    .filter(Boolean) ?? [];
  const { offset } = decodeCursor(parsed.data.cursor ?? null);

  try {
    const { rows, hasMore } = await loadFeedListingsFromDb(offset);
    const userProfile = await getUserProfile();

    let nextCursor: string | null = null;
    let out = rows;
    if (flags.RECOMMENDATIONS) {
      out = rankListings(rows, userProfile, { sessionBoostCities });
    } else {
      // Simple fallback: newness only (no AI weights)
      out = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    const listings = out.slice(0, limit);
    if (hasMore) {
      nextCursor = encodeCursor({ offset: offset + FEED_WINDOW });
    } else {
      nextCursor = null;
    }

    const guest = await getGuestId().catch(() => null);
    const cityBy: Record<string, string> = Object.fromEntries(listings.map((l) => [l.id, l.city]));
    const conv = flags.RECOMMENDATIONS
      ? await getConversionIntentByListingId(
          guest,
          listings.map((l) => l.id),
          cityBy
        ).catch(() => ({} as Record<string, "low" | "medium" | "high">))
      : ({} as Record<string, "low" | "medium" | "high">);

    const hostIds = [...new Set(listings.map((l) => l.ownerId).filter(Boolean))];
    const hostReps = flags.RECOMMENDATIONS ? await getHostReputationsForHostIds(hostIds) : new Map();

    return Response.json(
      {
        listings: listings.map((l) => ({
          id: l.id,
          title: l.title,
          city: l.city,
          price: l.price,
          imageUrl: l.imageUrl,
          createdAt: l.createdAt.toISOString(),
          conversionIntent: conv[l.id] ?? "low",
          socialProofStrength: l.socialProofStrength,
          reputationLevel: l.reputationLevel,
          hostReputationLevel: l.ownerId ? (hostReps.get(l.ownerId)?.level ?? "low") : "low",
        })),
        nextCursor,
        ranked: flags.RECOMMENDATIONS,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    logError(e, { route: "/api/feed/listings" });
    return Response.json({ error: "Failed to load feed" }, { status: 500 });
  }
}
