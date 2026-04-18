/**
 * Syria region facade — combines read adapter + normalizer; single entry for registry / intelligence / dashboards.
 */
import type { SyriaNormalizedFlaggedListing } from "./syria-normalizer.service";
import {
  normalizeSyriaFlaggedListing,
  normalizeSyriaListing,
  normalizeSyriaRegionSummary,
  normalizeSyriaUser,
} from "./syria-normalizer.service";
import {
  getSyriaBookingStats,
  getSyriaListingById,
  getSyriaRegionSummary,
  getSyriaUserRow,
  getSyriaUserStats,
  listSyriaFlaggedListings,
  listSyriaListingsSummary,
  type SyriaFlaggedListingRead,
  type SyriaListingsSummaryRead,
} from "./syria-read-adapter.service";
import type { SyriaNormalizedListing, SyriaNormalizedUser, SyriaRegionSummary } from "./syria-region.types";

export const SYRIA_REGION_CODE = "sy" as const;

export async function getListingById(listingId: string): Promise<{
  listing: SyriaNormalizedListing | null;
  availabilityNotes: string[];
}> {
  const res = await getSyriaListingById(listingId);
  const statsRes = listingId.trim()
    ? await getSyriaBookingStats(listingId.trim())
    : { data: null, availabilityNotes: [] as string[] };
  const mergedNotes = [...res.availabilityNotes, ...statsRes.availabilityNotes];
  const listing = normalizeSyriaListing(res.data, statsRes.data);
  return { listing, availabilityNotes: mergedNotes };
}

export async function listListingsSummary(): Promise<{
  summary: SyriaRegionSummary | null;
  raw: SyriaListingsSummaryRead | null;
  availabilityNotes: string[];
}> {
  const res = await listSyriaListingsSummary();
  const computedAt = new Date().toISOString();
  const normalized = normalizeSyriaRegionSummary(res.data, computedAt);
  return { summary: normalized, raw: res.data, availabilityNotes: res.availabilityNotes };
}

export async function getBookingStats(propertyId: string) {
  return getSyriaBookingStats(propertyId);
}

export async function getRegionSummary(): Promise<{
  summary: SyriaRegionSummary | null;
  availabilityNotes: string[];
}> {
  const res = await getSyriaRegionSummary();
  const computedAt = new Date().toISOString();
  return {
    summary: normalizeSyriaRegionSummary(res.data, computedAt),
    availabilityNotes: res.availabilityNotes,
  };
}

export async function getUserProfile(userId: string): Promise<{
  user: SyriaNormalizedUser | null;
  availabilityNotes: string[];
}> {
  const u = await getSyriaUserRow(userId);
  const s = await getSyriaUserStats(userId);
  const notes = [...u.availabilityNotes, ...s.availabilityNotes];
  return {
    user: normalizeSyriaUser(u.data, s.data),
    availabilityNotes: notes,
  };
}

export async function listFlaggedListings(limit?: number): Promise<{
  items: SyriaNormalizedFlaggedListing[];
  availabilityNotes: string[];
}> {
  const res = await listSyriaFlaggedListings(limit);
  const items =
    res.data?.map((r: SyriaFlaggedListingRead) => normalizeSyriaFlaggedListing(r)).filter(Boolean) as SyriaNormalizedFlaggedListing[];
  return { items: items ?? [], availabilityNotes: res.availabilityNotes };
}

/** Stable export for `region-adapter-registry` — same methods, explicit binding. */
export const syriaRegionAdapter = {
  regionCode: SYRIA_REGION_CODE,
  getListingById,
  listListingsSummary,
  getBookingStats,
  getRegionSummary,
  getUserProfile,
  listFlaggedListings,
};

export type SyriaRegionAdapter = typeof syriaRegionAdapter;
