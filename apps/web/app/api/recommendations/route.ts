import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { recommendListings, type GuestRecommendationPrefs } from "@/lib/ai/recommendationEngine";
import { query } from "@/lib/sql";
import type { PersonalizedRecommendationItem } from "@/modules/personalized-recommendations";
import {
  getPersonalizedRecommendations,
  parseBoolParam,
  parseRecommendationMode,
} from "@/modules/personalized-recommendations";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

async function isDebugAllowed(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return u?.role === PlatformRole.ADMIN;
}

function stripFactors(item: PersonalizedRecommendationItem, keep: boolean): PersonalizedRecommendationItem {
  if (keep) return item;
  const { factorsInternal: _f, ...rest } = item;
  return { ...rest, factorsInternal: {} };
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const sp = req.nextUrl.searchParams;
  const mode = parseRecommendationMode(sp.get("mode"));
  const limit = Math.min(parseInt(sp.get("limit") ?? "12", 10) || 12, 48);
  const marketSegment = sp.get("marketSegment")?.trim() || null;
  const personalization = parseBoolParam(sp.get("personalization"), true);
  const debugRequested = sp.get("debug") === "1";
  const cityHint = sp.get("city")?.trim() || null;

  const sessionUserId = await getGuestId();
  const debug = debugRequested && (await isDebugAllowed(sessionUserId));

  const result = await getPersonalizedRecommendations({
    userId: sessionUserId,
    mode,
    limit,
    marketSegment,
    personalization,
    debug,
    cityHint,
  });

  return NextResponse.json({
    ...result,
    items: result.items.map((i) => stripFactors(i, debug)),
    debug: debug ? result.debug : undefined,
  });
}

const PostPrefsZ = z
  .object({
    preferredCity: z.string().optional(),
    budget: z.number().positive().optional(),
    preferredPropertyType: z.string().optional(),
    interestCities: z.array(z.string()).optional(),
    behaviorBoost: z.boolean().optional(),
  })
  .strict();

type BnHubListingRow = {
  id: string;
  title: string;
  city: string;
  propertyType: string | null;
  nightPriceCents: string | number;
  rating: string | number | null;
};

const LISTING_CAP = 300;

/**
 * POST — score published BNHub stays from SQL + `recommendListings` (user prefs in body).
 * Complements session-based GET; useful for A/B, embeds, and explicit preference payloads.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    logError(e, { route: "/api/recommendations", method: "POST", phase: "parse_json" });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PostPrefsZ.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const user: GuestRecommendationPrefs = parsed.data;

  const raw = await query<BnHubListingRow>(
    `SELECT
       l."id",
       l."title",
       l."city",
       l."property_type" AS "propertyType",
       l."night_price_cents" AS "nightPriceCents",
       l."bnhub_listing_rating_average" AS "rating"
     FROM "bnhub_listings" l
     WHERE l."listing_status" = 'PUBLISHED'
     ORDER BY l."updated_at" DESC
     LIMIT $1`,
    [LISTING_CAP]
  );

  const listings = raw.map((r) => {
    const cents = typeof r.nightPriceCents === "string" ? parseInt(r.nightPriceCents, 10) : r.nightPriceCents;
    const price = Number.isFinite(cents) ? Math.max(0, cents) / 100 : 0;
    const rating =
      r.rating == null || r.rating === "" ? null : typeof r.rating === "string" ? parseFloat(r.rating) : r.rating;
    return {
      id: r.id,
      title: r.title,
      city: r.city,
      propertyType: r.propertyType,
      nightPriceCents: Number.isFinite(cents) ? cents : 0,
      price,
      rating: rating != null && Number.isFinite(rating) ? rating : null,
    };
  });

  const scored = recommendListings(user, listings);
  return NextResponse.json({ source: "bnhub_listings", cap: LISTING_CAP, items: scored });
}
