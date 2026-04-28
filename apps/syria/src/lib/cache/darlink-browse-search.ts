import { unstable_cache } from "next/cache";
import {
  SYRIA_BROWSE_SEARCH_CACHE_SECONDS,
  SYRIA_SYBNB_HOTEL_STRIP_CACHE_SECONDS,
} from "@/lib/syria/sybn104-performance";
import type { BrowseSurface, SearchPropertiesResult, SerializedBrowseListing } from "@/services/search/search.service";
import { fetchSybnbVerifiedHotelsStrip, searchProperties } from "@/services/search/search.service";

function stableFlatKey(flat: Record<string, string>): string {
  const pairs = Object.entries(flat)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => [k, v] as const);
  return JSON.stringify(pairs);
}

/**
 * ORDER SYBNB-82 — Dedupe identical browse SSR reads within the TTL (edge-friendly HTML when routes opt into ISR).
 */
export async function getCachedBrowseSearch(
  surface: BrowseSurface,
  flat: Record<string, string>,
): Promise<SearchPropertiesResult> {
  const key = stableFlatKey(flat);
  return unstable_cache(
    async () => searchProperties(surface, flat),
    ["darlink-browse-search-v1", surface, key],
    { revalidate: SYRIA_BROWSE_SEARCH_CACHE_SECONDS, tags: ["darlink-browse-search", surface] },
  )();
}

/** Verified HOTEL strip — cached independently from main stay search (SYBNB-82). */
export async function getCachedSybnbVerifiedHotelsStrip(flat: Record<string, string>): Promise<SerializedBrowseListing[]> {
  const key = stableFlatKey(flat);
  return unstable_cache(
    async () => fetchSybnbVerifiedHotelsStrip(flat),
    ["sybnb-verified-hotel-strip-v1", key],
    { revalidate: SYRIA_SYBNB_HOTEL_STRIP_CACHE_SECONDS, tags: ["sybnb-hotel-strip"] },
  )();
}
