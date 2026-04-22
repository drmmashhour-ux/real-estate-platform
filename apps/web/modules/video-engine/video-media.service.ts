import { prisma } from "@/lib/db";

import type { VideoScriptVm } from "./video-engine.types";

/** Collect raw URLs from platform rows — ranking/dedupe happens in assembly. */
export async function resolveMediaUrlsForScript(script: VideoScriptVm): Promise<{ urls: string[]; coverUrl: string | null }> {
  const kind = script.sourceKind;
  const id = script.sourceId;

  if (kind === "crm_listing" && id) {
    return { urls: [], coverUrl: null };
  }

  if (kind === "fsbo_listing" && id) {
    const f = await prisma.fsboListing.findUnique({
      where: { id },
      select: { coverImage: true, images: true },
    });
    if (!f) return { urls: [], coverUrl: null };
    const imgs = Array.isArray(f.images) ? f.images.filter(Boolean) : [];
    return { urls: imgs as string[], coverUrl: f.coverImage };
  }

  if (kind === "bnhub_listing" && id) {
    const [stay, photos] = await Promise.all([
      prisma.shortTermListing.findUnique({
        where: { id },
        select: { photos: true },
      }),
      prisma.bnhubListingPhoto.findMany({
        where: { listingId: id },
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        select: { url: true, isCover: true },
      }),
    ]);
    const fromRows = photos.map((p) => p.url);
    let legacy: string[] = [];
    if (stay?.photos != null && Array.isArray(stay.photos)) {
      legacy = stay.photos.filter((x): x is string => typeof x === "string" && x.length > 0);
    }
    const merged = [...fromRows, ...legacy.filter((u) => !fromRows.includes(u))];
    const coverFromBnhub = photos.find((p) => p.isCover)?.url ?? photos[0]?.url ?? null;
    return { urls: merged, coverUrl: coverFromBnhub ?? merged[0] ?? null };
  }

  if (kind === "investor_deal" && id) {
    const deal = await prisma.amfCapitalDeal.findUnique({
      where: { id },
      select: { listingId: true },
    });
    if (!deal?.listingId) return { urls: [], coverUrl: null };
    return { urls: [], coverUrl: null };
  }

  if (kind === "senior_residence" && id) {
    return { urls: [], coverUrl: null };
  }

  if (kind === "aggregate" && script.templateKey === "top_5_listings_area") {
    const city = script.title.replace(/^Top 5 in\s+/i, "").trim() || "";
    if (!city) return { urls: [], coverUrl: null };
    const listings = await prisma.fsboListing.findMany({
      where: { city: { equals: city, mode: "insensitive" }, status: "ACTIVE", archivedAt: null },
      orderBy: { priceCents: "desc" },
      take: 5,
      select: { coverImage: true, images: true },
    });
    const urls: string[] = [];
    let cover: string | null = null;
    for (const L of listings) {
      if (L.coverImage) {
        if (!cover) cover = L.coverImage;
        urls.push(L.coverImage);
      }
      for (const u of L.images) {
        if (u && !urls.includes(u)) urls.push(u);
      }
    }
    return { urls, coverUrl: cover };
  }

  return { urls: [], coverUrl: null };
}
