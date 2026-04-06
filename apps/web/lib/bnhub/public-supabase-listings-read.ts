import { getSupabaseServiceForGuestBookings } from "@/lib/stripe/guestSupabaseBooking";
import { haversineKm } from "@/lib/bnhub/geo";

export type PublicListingRow = {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  price_per_night: number;
  cover_image_url: string | null;
  /** Present when `latitude` / `longitude` columns exist and are set. */
  latitude?: number | null;
  longitude?: number | null;
  /** When `country` column is selected (extended browse row). */
  country?: string | null;
  /** Listing `star_rating` when present (1–5). */
  star_rating?: number | null;
  /** Up to 3 amenity labels for cards (from `amenities` JSON when extended row). */
  amenities_preview?: string[];
};

export type PublicListingDetail = PublicListingRow & {
  galleryUrls: string[];
  reviewSummary: { average: number | null; count: number };
  reviewPreview: { id: string; rating: number; comment: string | null; created_at: string | null }[];
  /** Parsed amenity labels for detail UI (empty if column missing or no amenities). */
  amenitiesList: string[];
  max_guests?: number | null;
  house_rules?: string | null;
  check_in_instructions?: string | null;
};

const LISTING_SELECT_BASE =
  "id,title,description,city,price_per_night,cover_image_url,created_at";
const LISTING_SELECT_GEO = `${LISTING_SELECT_BASE},latitude,longitude`;
/** Optional filter columns on `listings` — if missing, query falls back and filters client-side when possible. */
const LISTING_SELECT_FILTERS =
  `${LISTING_SELECT_GEO},property_type,room_type,max_guests,bedrooms,baths,bathrooms,star_rating,amenities,country`;

export type PublicListingsQuery = {
  q?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  /** Center for radius filter (requires listing coordinates + migration). */
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
  /** Normalized stay-type token (apartment, villa, hotel, luxury, room, studio, motel, shared_room). */
  propertyType?: string | null;
  guests?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  /** Minimum star rating (1–5) when `star_rating` exists on row. */
  minRating?: number | null;
  /** Amenities labels; listing must match all (case-insensitive substring on JSON array). */
  amenities?: string[] | null;
  /** Exact match on `listings.country` when the column exists (retried without if missing). */
  country?: string | null;
  /** Exact match on `listings.city`. */
  city?: string | null;
};

function sanitizeIlikeFragment(raw: string): string {
  return raw.replace(/[%_]/g, "").trim().slice(0, 120);
}

function numOrUndef(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function amenityStrings(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).toLowerCase().trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) return p.map((x) => String(x).toLowerCase().trim()).filter(Boolean);
    } catch {
      /* ignore */
    }
  }
  return [];
}

/**
 * Client-side row match when extended columns are present (Booking.com–style filters).
 */
function listingRowMatchesAdvancedFilters(
  row: Record<string, unknown>,
  query: PublicListingsQuery
): boolean {
  const pt = typeof query.propertyType === "string" ? query.propertyType.trim().toLowerCase() : "";
  if (pt) {
    const prop = String(row.property_type ?? "").toLowerCase();
    const room = String(row.room_type ?? "").toLowerCase();
    const title = String(row.title ?? "").toLowerCase();
    const hay = `${prop} ${room} ${title}`;
    let ok = false;
    if (pt === "shared_room") ok = room.includes("shared") || hay.includes("shared room");
    else if (pt === "room") ok = room.includes("private") || prop.includes("room");
    else if (pt === "studio") ok = prop.includes("studio") || title.includes("studio");
    else if (pt === "motel") ok = prop.includes("motel") || title.includes("motel");
    else if (pt === "luxury") ok = prop.includes("luxury") || title.includes("luxury");
    else ok = prop.includes(pt) || title.includes(pt);
    if (!ok) return false;
  }

  const guests = typeof query.guests === "number" && query.guests > 0 ? query.guests : null;
  if (guests != null) {
    const mg = numOrUndef(row.max_guests);
    if (mg != null && mg < guests) return false;
  }

  const br = typeof query.bedrooms === "number" && query.bedrooms > 0 ? query.bedrooms : null;
  if (br != null) {
    const b = numOrUndef(row.bedrooms);
    if (b != null && b < br) return false;
  }

  const bt = typeof query.bathrooms === "number" && query.bathrooms > 0 ? query.bathrooms : null;
  if (bt != null) {
    const bath = numOrUndef(row.baths) ?? numOrUndef(row.bathrooms);
    if (bath != null && bath < bt) return false;
  }

  const minR = typeof query.minRating === "number" && query.minRating >= 1 && query.minRating <= 5 ? query.minRating : null;
  if (minR != null) {
    const sr = numOrUndef(row.star_rating);
    if (sr != null && sr < minR) return false;
  }

  const am = query.amenities?.filter((a) => a.trim()).map((a) => a.toLowerCase().trim()) ?? [];
  if (am.length > 0) {
    const have = amenityStrings(row.amenities);
    const joined = have.join(" ");
    for (const need of am) {
      if (!joined.includes(need) && !have.some((h) => h.includes(need) || need.includes(h))) {
        return false;
      }
    }
  }

  return true;
}

const AMENITY_CARD_LABELS: Record<string, string> = {
  wifi: "WiFi",
  "wi-fi": "WiFi",
  kitchen: "Kitchen",
  parking: "Parking",
  pool: "Pool",
  ac: "AC",
  washer: "Washer",
  gym: "Gym",
};

function formatAmenityLabel(raw: string): string {
  const k = raw.toLowerCase().trim();
  if (AMENITY_CARD_LABELS[k]) return AMENITY_CARD_LABELS[k];
  if (k.length === 0) return "";
  return k.replace(/\b\w/g, (c) => c.toUpperCase());
}

function amenitiesPreviewFromRow(raw: unknown): string[] {
  const have = amenityStrings(raw);
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const h of have) {
    const lab = formatAmenityLabel(h);
    if (!lab || seen.has(lab)) continue;
    seen.add(lab);
    labels.push(lab);
    if (labels.length >= 3) break;
  }
  return labels;
}

function amenitiesFullListFromRow(raw: unknown): string[] {
  const have = amenityStrings(raw);
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const h of have) {
    const lab = formatAmenityLabel(h);
    if (!lab || seen.has(lab)) continue;
    seen.add(lab);
    labels.push(lab);
  }
  return labels;
}

function parseListingRowForDetail(L: Record<string, unknown>): PublicListingRow {
  const lat = L.latitude;
  const lng = L.longitude;
  const base: PublicListingRow = {
    id: String(L.id),
    title: typeof L.title === "string" ? L.title : "",
    description: typeof L.description === "string" ? L.description : null,
    city: typeof L.city === "string" ? L.city : null,
    price_per_night:
      typeof L.price_per_night === "number" ? L.price_per_night : Number(L.price_per_night) || 0,
    cover_image_url: typeof L.cover_image_url === "string" ? L.cover_image_url : null,
    ...(typeof lat === "number" && typeof lng === "number"
      ? { latitude: lat, longitude: lng }
      : {}),
  };
  if (typeof L.country === "string" && L.country.trim()) {
    base.country = L.country.trim();
  }
  const sr = numOrUndef(L.star_rating);
  if (sr != null && sr > 0) {
    base.star_rating = sr;
  }
  const preview = amenitiesPreviewFromRow(L.amenities);
  if (preview.length > 0) {
    base.amenities_preview = preview;
  }
  return base;
}

function parseRow(r: Record<string, unknown>): PublicListingRow {
  const lat = r.latitude;
  const lng = r.longitude;
  const base: PublicListingRow = {
    id: String(r.id),
    title: typeof r.title === "string" ? r.title : "",
    description: typeof r.description === "string" ? r.description : null,
    city: typeof r.city === "string" ? r.city : null,
    price_per_night:
      typeof r.price_per_night === "number" ? r.price_per_night : Number(r.price_per_night) || 0,
    cover_image_url: typeof r.cover_image_url === "string" ? r.cover_image_url : null,
    ...(typeof lat === "number" && typeof lng === "number"
      ? { latitude: lat, longitude: lng }
      : {}),
  };
  if (typeof r.country === "string" && r.country.trim()) {
    base.country = r.country.trim();
  }
  const sr = numOrUndef(r.star_rating);
  if (sr != null && sr > 0) {
    base.star_rating = sr;
  }
  const preview = amenitiesPreviewFromRow(r.amenities);
  if (preview.length > 0) {
    base.amenities_preview = preview;
  }
  return base;
}

/**
 * Guest browse: Supabase `listings` via service role with optional search/filters (platform API).
 */
export async function listPublicBnhubListingsFiltered(
  query: PublicListingsQuery
): Promise<{ ok: true; listings: PublicListingRow[] } | { ok: false; status: number; error: string }> {
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { ok: false, status: 503, error: "Listings service is not configured." };
  }
  const supabase = sb;

  let usedExtendedSelect = false;
  const ctry = typeof query.country === "string" ? query.country.trim() : "";
  const cty = typeof query.city === "string" ? query.city.trim() : "";
  const locationPasses = ctry ? [false, true] : [false];

  async function runQuery(select: string, omitCountryEq: boolean) {
    let req = supabase.from("listings").select(select).order("created_at", { ascending: false });

    const minP = query.minPrice;
    const maxP = query.maxPrice;
    if (typeof minP === "number" && Number.isFinite(minP) && minP >= 0) {
      req = req.gte("price_per_night", minP);
    }
    if (typeof maxP === "number" && Number.isFinite(maxP) && maxP >= 0) {
      req = req.lte("price_per_night", maxP);
    }

    const qRaw = typeof query.q === "string" ? query.q : "";
    const qSafe = sanitizeIlikeFragment(qRaw);
    if (qSafe.length > 0) {
      const p = `%${qSafe}%`;
      req = req.or(`title.ilike.${p},description.ilike.${p},city.ilike.${p}`);
    }

    if (cty) {
      req = req.eq("city", cty);
    }
    if (ctry && !omitCountryEq) {
      req = req.eq("country", ctry);
    }

    // Guests/beds/baths/rating are applied in-memory when extended rows load — avoids
    // PostgREST errors when Supabase column names differ (e.g. baths vs bathrooms).

    return await req;
  }

  let data: unknown[] | null = null;
  let error: { message: string } | null = null;

  outer: for (const omitCountryEq of locationPasses) {
    let r = await runQuery(LISTING_SELECT_FILTERS, omitCountryEq);
    if (!r.error) {
      data = r.data as unknown[] | null;
      error = null;
      usedExtendedSelect = true;
      break outer;
    }
    if (!r.error.message?.toLowerCase().includes("column")) {
      error = r.error;
      break outer;
    }
    r = await runQuery(LISTING_SELECT_GEO, omitCountryEq);
    if (!r.error) {
      data = r.data as unknown[] | null;
      error = null;
      usedExtendedSelect = false;
      break outer;
    }
    if (!r.error.message?.toLowerCase().includes("column")) {
      error = r.error;
      break outer;
    }
    if (LISTING_SELECT_GEO.includes("latitude")) {
      r = await runQuery(LISTING_SELECT_BASE, omitCountryEq);
      if (!r.error) {
        data = r.data as unknown[] | null;
        error = null;
        usedExtendedSelect = false;
        break outer;
      }
      error = r.error;
      if (!r.error.message?.toLowerCase().includes("column")) break outer;
    } else {
      error = r.error;
      break outer;
    }
  }

  if (error) {
    return { ok: false, status: 502, error: error.message };
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  let listings: PublicListingRow[] = rows.map(parseRow);

  const hasAdvanced =
    Boolean(query.propertyType?.trim()) ||
    (typeof query.guests === "number" && query.guests > 0) ||
    (typeof query.bedrooms === "number" && query.bedrooms > 0) ||
    (typeof query.bathrooms === "number" && query.bathrooms > 0) ||
    (typeof query.minRating === "number" && query.minRating >= 1) ||
    (query.amenities?.length ?? 0) > 0;

  if (hasAdvanced && usedExtendedSelect) {
    const narrowed = rows.filter((r) => listingRowMatchesAdvancedFilters(r, query));
    listings = narrowed.map(parseRow);
  }

  const lat = query.lat;
  const lng = query.lng;
  const rad = query.radiusKm;
  if (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng) &&
    typeof rad === "number" &&
    Number.isFinite(rad) &&
    rad > 0
  ) {
    listings = listings.filter((L) => {
      if (L.latitude == null || L.longitude == null) return false;
      return haversineKm(lat, lng, L.latitude, L.longitude) <= rad;
    });
  }

  return { ok: true, listings };
}

export async function listPublicBnhubListings(): Promise<
  { ok: true; listings: PublicListingRow[] } | { ok: false; status: number; error: string }
> {
  return listPublicBnhubListingsFiltered({});
}

/** Detail fetch: widest select first; on unknown-column errors, retry narrower selects (Supabase schemas vary). */
const LISTING_DETAIL_SELECT_TRIES = [
  `${LISTING_SELECT_BASE},country,star_rating,amenities,max_guests,house_rules,check_in_instructions`,
  `${LISTING_SELECT_BASE},country,star_rating,amenities,max_guests`,
  `${LISTING_SELECT_BASE},country,star_rating,amenities`,
  `${LISTING_SELECT_BASE},country,star_rating`,
  `${LISTING_SELECT_BASE},country`,
  LISTING_SELECT_BASE,
];

export async function getPublicBnhubListingDetail(
  listingId: string,
  reviewPreviewLimit = 8
): Promise<{ ok: true; detail: PublicListingDetail } | { ok: false; status: number; error: string }> {
  const id = listingId.trim();
  if (!id) {
    return { ok: false, status: 400, error: "listing id is required." };
  }
  const sb = getSupabaseServiceForGuestBookings();
  if (!sb) {
    return { ok: false, status: 503, error: "Listings service is not configured." };
  }

  let listing: Record<string, unknown> | null = null;
  let lastError: { message: string } | null = null;

  for (const sel of LISTING_DETAIL_SELECT_TRIES) {
    const r = await sb.from("listings").select(sel).eq("id", id).maybeSingle();
    if (!r.error && r.data) {
      listing = r.data as unknown as Record<string, unknown>;
      break;
    }
    if (r.error) {
      lastError = r.error;
      const col = r.error.message?.toLowerCase().includes("column");
      if (!col) {
        return { ok: false, status: 502, error: r.error.message };
      }
    }
  }

  if (!listing) {
    if (lastError) {
      return { ok: false, status: 502, error: lastError.message };
    }
    return { ok: false, status: 404, error: "Listing not found." };
  }

  const L = listing;
  const base = parseListingRowForDetail(L);
  const amenitiesList = amenitiesFullListFromRow(L.amenities);
  const mg = numOrUndef(L.max_guests);
  const max_guests = mg != null && mg > 0 ? Math.floor(mg) : null;
  const house_rules =
    typeof L.house_rules === "string" && L.house_rules.trim() ? L.house_rules.trim() : null;
  const check_in_instructions =
    typeof L.check_in_instructions === "string" && L.check_in_instructions.trim()
      ? L.check_in_instructions.trim()
      : null;

  const { data: imgs } = await sb
    .from("listing_images")
    .select("url")
    .eq("listing_id", id)
    .order("sort_order", { ascending: true });

  const galleryUrls = (imgs ?? [])
    .map((r: { url?: string }) => (typeof r.url === "string" ? r.url : ""))
    .filter(Boolean);

  const { data: revs, error: rErr } = await sb
    .from("reviews")
    .select("id, rating, comment, created_at")
    .eq("listing_id", id)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(50, reviewPreviewLimit)));

  const reviewRows = !rErr && revs ? revs : [];
  const ratings = (reviewRows as { rating: number }[]).map((x) => x.rating);
  const count = ratings.length;
  const average =
    count > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / count) * 10) / 10 : null;

  const reviewPreview = (
    reviewRows as { id: string; rating: number; comment: string | null; created_at: string | null }[]
  ).map((r) => ({
    id: r.id,
    listing_id: id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at ?? "",
  }));

  return {
    ok: true,
    detail: {
      ...base,
      galleryUrls,
      reviewSummary: { average, count },
      reviewPreview,
      amenitiesList,
      max_guests,
      house_rules,
      check_in_instructions,
    },
  };
}
