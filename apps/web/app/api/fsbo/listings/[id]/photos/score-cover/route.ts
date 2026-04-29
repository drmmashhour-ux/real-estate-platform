import { fetchRemoteImageBufferForAssessment } from "@/lib/fsbo/fetch-remote-image-buffer";
import { inferListingKind, type ListingLikeForCaption } from "@/lib/listings/caption-input";
import { rankListingPhotosForCover } from "@/lib/images/select-best-photo";
import { getLegacyDB } from "@/lib/db/legacy";
import { getGuestId } from "@/lib/auth/session";
import type { FsboPhotoType } from "@/lib/fsbo/photo-limits";

const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 5 * 60 * 1000;
const scoreCache = new Map<string, { exp: number; payload: unknown }>();

async function bufferFromListingPhotoUrl(url: string): Promise<Buffer | null> {
  const u = url.trim();
  if (!u) return null;
  const maxBytes = 10 * 1024 * 1024;
  if (/^https?:\/\//i.test(u)) {
    return fetchRemoteImageBufferForAssessment(u, maxBytes);
  }
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "") ?? "";
  const pathOnly = u.startsWith("/") ? u : `/${u}`;
  const full = origin ? `${origin}${pathOnly}` : null;
  if (!full) return null;
  return fetchRemoteImageBufferForAssessment(full, maxBytes);
}

/**
 * POST `{ urls: string[], photoTags?: FsboPhotoType[] }` — scores gallery shots server-side (buffers stay on-platform).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: listingId } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const listing = await prisma.fsboListing.findFirst({
    where: { id: listingId, ownerId: userId },
    select: {
      images: true,
      listingDealType: true,
      status: true,
    },
  });
  if (!listing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (listing.status === "SOLD") {
    return Response.json({ error: "Sold listings cannot be edited" }, { status: 409 });
  }

  let body: { urls?: unknown; photoTags?: unknown };
  try {
    body = (await request.json()) as { urls?: unknown; photoTags?: unknown };
  } catch {
    return Response.json({ error: "Expected JSON body" }, { status: 400 });
  }

  const urls = Array.isArray(body.urls) ? body.urls.filter((u): u is string => typeof u === "string" && u.trim()) : [];
  const tags = Array.isArray(body.photoTags)
    ? body.photoTags.filter((t): t is string => typeof t === "string")
    : [];

  if (urls.length === 0) {
    return Response.json({ error: "urls required" }, { status: 400 });
  }

  const cacheKey = `${listingId}:${urls.join("|").slice(0, 800)}`;
  const hit = scoreCache.get(cacheKey);
  if (hit && hit.exp > Date.now()) {
    return Response.json(hit.payload);
  }

  const typedTags = tags as FsboPhotoType[];

  const listingHint: ListingLikeForCaption = {
    title: "",
    city: "",
    listingDealType: listing.listingDealType,
  };
  const listingKind = inferListingKind(listingHint);

  const buffers = await Promise.all(urls.map((u) => bufferFromListingPhotoUrl(u)));
  const pairs: { buffer: Buffer; index: number }[] = [];
  for (let i = 0; i < urls.length; i++) {
    const buf = buffers[i];
    if (buf != null && buf.length > 64) {
      pairs.push({ buffer: buf, index: i });
    }
  }

  if (pairs.length === 0) {
    return Response.json({ error: "Could not load images for scoring" }, { status: 400 });
  }

  const rankResult = await rankListingPhotosForCover(
    pairs.map((p) => ({ buffer: p.buffer })),
    {
      listingKind,
      photoTypes: pairs.map((p) => typedTags[p.index]),
    },
  );

  const scoresOut = rankResult.scores.map((row, i) => ({
    index: pairs[i]?.index ?? row.index,
    score: row.score,
    reasons: row.reasons,
  }));

  const bestGlobal = pairs[rankResult.bestIndex]?.index ?? 0;

  const payload = {
    bestImageIndex: bestGlobal,
    scores: scoresOut,
  };

  scoreCache.set(cacheKey, { exp: Date.now() + CACHE_TTL_MS, payload });
  return Response.json(payload);
}
