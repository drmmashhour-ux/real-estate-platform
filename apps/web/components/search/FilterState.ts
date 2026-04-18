/**
 * Global search filter contract — shared by UI, URL, and APIs.
 * Sentinels: priceMin/priceMax === 0 mean “no bound” for that side.
 */

/**
 * Query flag (?openFilters=1): open the full SearchEngine property filter panel once, then strip from URL.
 * Used when linking from /listings to /buy so filters match the Buy hub.
 */
export const OPEN_FULL_PROPERTY_FILTERS_PARAM = "openFilters";

/** Long-term rent — listing segment (deal stays RENT; see `rentListingCategory`). */
export type RentListingCategory = "residential" | "commercial" | "luxury_properties" | "new_construction";

export type GlobalSearchFilterType =
  | "buy"
  | "rent"
  | "short"
  | "commercial"
  /** For sale — excludes commercial property type. */
  | "residential"
  /** Seller journey — browse search is disabled; UI routes to /selling. */
  | "sell"
  /** Recently updated FSBO listings (last 14 days). */
  | "new_listing"
  /** List price at least $1M CAD. */
  | "luxury_properties"
  /** Keyword / description match for new-build inventory. */
  | "new_construction";

/** SearchEngine / page context — which filter surface to show (buy vs rent vs short-term). */
export type SearchEngineMode = "buy" | "rent" | "short";

/** Canonical payload every search API accepts (POST body or normalized GET). */
export type GlobalSearchFilters = {
  location: string;
  type: GlobalSearchFilterType;
  priceMin: number;
  priceMax: number;
  /** Minimum bedrooms; `null` = any */
  bedrooms: number | null;
  features: string[];
};

/** Extra fields used by BuyHub / stays UIs (still merged into API parsing). */
export type GlobalSearchFiltersExtended = GlobalSearchFilters & {
  bathrooms?: number | null;
  propertyType?: string;
  /** Multi-select property types (Centris-style); when set, takes precedence over `propertyType` in browse API. */
  propertyTypes?: string[];
  minSqft?: number | null;
  maxSqft?: number | null;
  yearBuiltMin?: number | null;
  yearBuiltMax?: number | null;
  page?: number;
  /** When `type` is `short` (BNHUB stays). */
  checkIn?: string;
  checkOut?: string;
  guests?: number | null;
  sort?: string;
  roomType?: string;
  /** Long-term rent — minimum lease length (months). `null` / `0` = any. */
  leaseMonthsMin?: number | null;
  /** Long-term rent — furnished preference. */
  furnished?: "any" | "yes" | "no";
  /** When `type === "rent"`, narrows residential / commercial / luxury / new construction. */
  rentListingCategory?: RentListingCategory | null;
  /** Map viewport (WGS84). All four required to filter by bbox. */
  north?: number | null;
  south?: number | null;
  east?: number | null;
  west?: number | null;
  /** Results layout when map is enabled: list | split | map */
  mapLayout?: "list" | "split" | "map";
};

export const DEFAULT_GLOBAL_FILTERS: GlobalSearchFiltersExtended = {
  location: "",
  type: "buy",
  priceMin: 0,
  priceMax: 0,
  bedrooms: null,
  features: [],
  bathrooms: null,
  propertyType: "",
  propertyTypes: [],
  minSqft: null,
  maxSqft: null,
  yearBuiltMin: null,
  yearBuiltMax: null,
  page: 1,
  checkIn: "",
  checkOut: "",
  guests: null,
  sort: "recommended",
  roomType: "",
  leaseMonthsMin: null,
  furnished: "any",
  rentListingCategory: null,
  north: null,
  south: null,
  east: null,
  west: null,
  /** Default split view so map acts as a search tool (viewport → URL bbox) on browse surfaces. */
  mapLayout: "split",
};

export const DEFAULT_STAYS_FILTERS: GlobalSearchFiltersExtended = {
  ...DEFAULT_GLOBAL_FILTERS,
  type: "short",
  sort: "recommended",
};

const TYPE_SET = new Set<GlobalSearchFilterType>([
  "buy",
  "rent",
  "short",
  "commercial",
  "residential",
  "sell",
  "new_listing",
  "luxury_properties",
  "new_construction",
]);

/**
 * For sale browse links — `new_listing` is not a mode; use the dedicated “recently added” CTA instead.
 */
export function listingTypeForSaleBrowseHref(t: GlobalSearchFilterType): GlobalSearchFilterType {
  if (t === "new_listing") return "buy";
  if (t === "sell" || t === "rent" || t === "short") return "buy";
  if (
    t === "commercial" ||
    t === "residential" ||
    t === "luxury_properties" ||
    t === "new_construction" ||
    t === "buy"
  )
    return t;
  return "buy";
}

export function normalizeGlobalSearchType(v: unknown): GlobalSearchFilterType {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (
    s === "buy" ||
    s === "rent" ||
    s === "short" ||
    s === "commercial" ||
    s === "residential" ||
    s === "sell" ||
    s === "new_listing" ||
    s === "luxury_properties" ||
    s === "new_construction"
  )
    return s;
  return "buy";
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function intOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

function featuresArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim().toLowerCase());
}

function propertyTypesArr(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
  }
  if (typeof v === "string" && v.trim()) {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function rentListingCategoryFromUnknown(v: unknown): RentListingCategory | null {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (
    s === "residential" ||
    s === "commercial" ||
    s === "luxury_properties" ||
    s === "new_construction"
  )
    return s;
  return null;
}

function furnishedFromUnknown(v: unknown): "any" | "yes" | "no" {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (s === "yes" || s === "true" || s === "1") return "yes";
  if (s === "no" || s === "false" || s === "0") return "no";
  return "any";
}

function floatOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export function parseMapLayout(v: unknown): "list" | "split" | "map" {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (s === "split" || s === "map" || s === "list") return s;
  return "split";
}

/** True when all bbox corners are set and form a valid non-degenerate box (no dateline handling). */
export function hasValidMapBounds(f: GlobalSearchFiltersExtended): boolean {
  const { north, south, east, west } = f;
  if (north == null || south == null || east == null || west == null) return false;
  if (!(north > south && east > west)) return false;
  if (south < -90 || north > 90 || west < -180 || east > 180) return false;
  return true;
}

/** Parse and validate POST JSON (or merged query) into extended filters. */
export function parseGlobalSearchBody(raw: unknown): GlobalSearchFiltersExtended {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const type = normalizeGlobalSearchType(o.type);
  const pts = propertyTypesArr(o.propertyTypes);
  const singlePt = typeof o.propertyType === "string" ? o.propertyType : "";
  return {
    ...DEFAULT_GLOBAL_FILTERS,
    location: typeof o.location === "string" ? o.location : "",
    type: TYPE_SET.has(type as GlobalSearchFilterType) ? type : "buy",
    priceMin: Math.max(0, num(o.priceMin)),
    priceMax: Math.max(0, num(o.priceMax)),
    bedrooms: intOrNull(o.bedrooms),
    features: featuresArr(o.features),
    bathrooms: intOrNull(o.bathrooms),
    propertyType: singlePt,
    propertyTypes: pts.length > 0 ? pts : singlePt.trim() ? [singlePt.trim()] : [],
    minSqft: intOrNull(o.minSqft),
    maxSqft: intOrNull(o.maxSqft),
    yearBuiltMin: intOrNull(o.yearBuiltMin),
    yearBuiltMax: intOrNull(o.yearBuiltMax),
    page: Math.max(1, intOrNull(o.page) ?? 1),
    checkIn: typeof o.checkIn === "string" ? o.checkIn : "",
    checkOut: typeof o.checkOut === "string" ? o.checkOut : "",
    guests: intOrNull(o.guests),
    sort: typeof o.sort === "string" && o.sort.trim() ? o.sort.trim() : "recommended",
    roomType: typeof o.roomType === "string" ? o.roomType : "",
    leaseMonthsMin: intOrNull(o.leaseMonthsMin),
    furnished: furnishedFromUnknown(o.furnished),
    north: floatOrNull(o.north),
    south: floatOrNull(o.south),
    east: floatOrNull(o.east),
    west: floatOrNull(o.west),
    mapLayout: parseMapLayout(o.mapLayout),
    rentListingCategory: rentListingCategoryFromUnknown(o.rentListingCategory),
  };
}

/** Serialize extended filters to URLSearchParams (legacy + global keys). */
export function globalFiltersToUrlParams(f: GlobalSearchFiltersExtended): URLSearchParams {
  const p = new URLSearchParams();
  if (f.location.trim()) p.set("city", f.location.trim());
  if (f.type === "rent") p.set("dealType", "RENT");
  else p.set("dealType", "SALE");
  const minForUrl = f.type === "luxury_properties" ? Math.max(f.priceMin, 1_000_000) : f.priceMin;
  if (minForUrl > 0) p.set("minPrice", String(Math.round(minForUrl)));
  if (f.priceMax > 0) p.set("maxPrice", String(Math.round(f.priceMax)));
  if (f.bedrooms != null && f.bedrooms >= 0) p.set("bedrooms", String(f.bedrooms));
  if (f.bathrooms != null && f.bathrooms >= 0) p.set("bathrooms", String(f.bathrooms));
  if (f.type === "commercial") {
    p.set("filterType", "commercial");
    p.set("propertyType", "COMMERCIAL");
  } else {
    p.set("filterType", f.type);
    const pts = f.propertyTypes?.filter((x) => x.trim()) ?? [];
    if (pts.length > 0) {
      p.set("propertyTypes", pts.join(","));
    } else if (f.propertyType?.trim()) {
      p.set("propertyType", f.propertyType.trim());
    }
  }
  if (f.minSqft != null && f.minSqft >= 0) p.set("minSqft", String(f.minSqft));
  if (f.maxSqft != null && f.maxSqft >= 0) p.set("maxSqft", String(f.maxSqft));
  if (f.yearBuiltMin != null && f.yearBuiltMin > 1700) p.set("yearBuiltMin", String(f.yearBuiltMin));
  if (f.yearBuiltMax != null && f.yearBuiltMax > 1700) p.set("yearBuiltMax", String(f.yearBuiltMax));
  if (f.features.length) p.set("features", f.features.join(","));
  if (f.page && f.page > 1) p.set("page", String(f.page));
  if (f.type === "rent") {
    if (f.rentListingCategory) p.set("listingCategory", f.rentListingCategory);
    if (f.leaseMonthsMin != null && f.leaseMonthsMin > 0) p.set("leaseMonthsMin", String(f.leaseMonthsMin));
    if (f.furnished === "yes" || f.furnished === "no") p.set("furnished", f.furnished);
  }
  if (hasValidMapBounds(f)) {
    p.set("north", String(f.north));
    p.set("south", String(f.south));
    p.set("east", String(f.east));
    p.set("west", String(f.west));
  }
  if (f.mapLayout && f.mapLayout !== "split") p.set("mapLayout", f.mapLayout);
  if (f.sort && f.sort !== "recommended") p.set("sort", f.sort);
  return p;
}

/** Read URL (legacy query) into extended global filters. */
export function urlParamsToGlobalFilters(sp: URLSearchParams): GlobalSearchFiltersExtended {
  const deal = sp.get("dealType")?.toUpperCase();
  const filterType = sp.get("filterType")?.toLowerCase();
  const listingCategoryRaw = sp.get("listingCategory")?.toLowerCase();
  let rentListingCategory: RentListingCategory | null = null;
  let type: GlobalSearchFilterType = "buy";

  if (deal === "RENT") {
    type = "rent";
    if (
      listingCategoryRaw === "residential" ||
      listingCategoryRaw === "commercial" ||
      listingCategoryRaw === "luxury_properties" ||
      listingCategoryRaw === "new_construction"
    ) {
      rentListingCategory = listingCategoryRaw;
    } else if (
      filterType === "residential" ||
      filterType === "commercial" ||
      filterType === "luxury_properties" ||
      filterType === "new_construction"
    ) {
      rentListingCategory = filterType as RentListingCategory;
    }
  } else if (
    filterType === "rent" ||
    filterType === "short" ||
    filterType === "commercial" ||
    filterType === "buy" ||
    filterType === "residential" ||
    filterType === "sell" ||
    filterType === "new_listing" ||
    filterType === "luxury_properties" ||
    filterType === "new_construction"
  ) {
    type = filterType as GlobalSearchFilterType;
  }
  const pt = sp.get("propertyType")?.trim() ?? "";
  const ptsRaw = sp.get("propertyTypes")?.trim() ?? "";
  const propertyTypesFromUrl = ptsRaw
    ? ptsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  if (
    type !== "residential" &&
    type !== "rent" &&
    type !== "sell" &&
    type !== "new_listing" &&
    type !== "luxury_properties" &&
    type !== "new_construction" &&
    (pt.toUpperCase() === "COMMERCIAL" || filterType === "commercial")
  ) {
    type = "commercial";
  }

  const featuresRaw = sp.get("features")?.trim() ?? "";
  const features = featuresRaw ? featuresRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : [];

  const minP = sp.get("minPrice");
  const maxP = sp.get("maxPrice");
  const bed = sp.get("bedrooms");
  const bath = sp.get("bathrooms");

  const propertyTypesResolved =
    propertyTypesFromUrl.length > 0
      ? propertyTypesFromUrl
      : pt && type !== "commercial"
        ? [pt]
        : [];

  const rawMin = minP ? Math.max(0, parseInt(minP, 10) || 0) : 0;
  const priceMinResolved =
    type === "luxury_properties" || (type === "rent" && rentListingCategory === "luxury_properties")
      ? Math.max(rawMin, 1_000_000)
      : rawMin;

  return {
    ...DEFAULT_GLOBAL_FILTERS,
    location: sp.get("city") ?? "",
    type,
    rentListingCategory,
    priceMin: priceMinResolved,
    priceMax: maxP ? Math.max(0, parseInt(maxP, 10) || 0) : 0,
    bedrooms: bed && !Number.isNaN(parseInt(bed, 10)) ? parseInt(bed, 10) : null,
    bathrooms: bath && !Number.isNaN(parseInt(bath, 10)) ? parseInt(bath, 10) : null,
    propertyType: pt && type !== "commercial" ? pt : type === "commercial" ? "COMMERCIAL" : "",
    propertyTypes: propertyTypesResolved,
    minSqft: sp.get("minSqft") ? parseInt(sp.get("minSqft")!, 10) : null,
    maxSqft: sp.get("maxSqft") ? parseInt(sp.get("maxSqft")!, 10) : null,
    yearBuiltMin: sp.get("yearBuiltMin") ? parseInt(sp.get("yearBuiltMin")!, 10) : null,
    yearBuiltMax: sp.get("yearBuiltMax") ? parseInt(sp.get("yearBuiltMax")!, 10) : null,
    features,
    page: Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1),
    leaseMonthsMin: (() => {
      const raw = sp.get("leaseMonthsMin");
      if (!raw) return null;
      const n = parseInt(raw, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    })(),
    furnished: furnishedFromUnknown(sp.get("furnished")),
    north: floatOrNull(sp.get("north")),
    south: floatOrNull(sp.get("south")),
    east: floatOrNull(sp.get("east")),
    west: floatOrNull(sp.get("west")),
    mapLayout: parseMapLayout(sp.get("mapLayout")),
    sort: (() => {
      const s = sp.get("sort");
      if (
        s === "priceAsc" ||
        s === "priceDesc" ||
        s === "newest" ||
        s === "recommended" ||
        s === "ranking" ||
        s === "ai" ||
        s === "aiScore"
      )
        return s;
      if (type === "new_listing") return "newest";
      return "recommended";
    })(),
  };
}

/** BNHUB amenity / host flags stored in `features` when `type === "short"`. */
export const BNHUB_AMENITY_KEYS = ["wifi", "kitchen", "ac", "parking", "washer", "pet_friendly"] as const;
export type BnhubAmenityKey = (typeof BNHUB_AMENITY_KEYS)[number];

/**
 * Active filter count — semantics depend on `SearchEngineMode` (same payload, different UI groups).
 */
export function countActiveGlobalFilters(f: GlobalSearchFiltersExtended, mode: SearchEngineMode): number {
  let n = 0;
  if (f.location.trim()) n++;

  if (mode === "buy") {
    if (f.type !== "buy") n++;
    if (f.priceMin > 0 || f.priceMax > 0) n++;
    if (f.bedrooms != null) n++;
    if (f.bathrooms != null && f.bathrooms >= 0) n++;
    if ((f.propertyTypes?.length ?? 0) > 0) n++;
    else if (f.propertyType?.trim() && f.type !== "commercial") n++;
    if (f.minSqft != null && f.minSqft > 0) n++;
    if (f.maxSqft != null && f.maxSqft > 0) n++;
    if (f.yearBuiltMin != null && f.yearBuiltMin > 1700) n++;
    if (f.yearBuiltMax != null && f.yearBuiltMax > 1700) n++;
    n += f.features.length;
    if (hasValidMapBounds(f)) n++;
    return n;
  }

  if (mode === "rent") {
    if (f.rentListingCategory) n++;
    if (f.priceMin > 0 || f.priceMax > 0) n++;
    if (f.leaseMonthsMin != null && f.leaseMonthsMin > 0) n++;
    if (f.furnished === "yes" || f.furnished === "no") n++;
    if (f.bathrooms != null && f.bathrooms >= 0) n++;
    if (f.minSqft != null && f.minSqft > 0) n++;
    if (f.maxSqft != null && f.maxSqft > 0) n++;
    if (f.yearBuiltMin != null && f.yearBuiltMin > 1700) n++;
    if (f.yearBuiltMax != null && f.yearBuiltMax > 1700) n++;
    if ((f.propertyTypes?.length ?? 0) > 0) n++;
    else if (f.propertyType?.trim()) n++;
    n += f.features.length;
    if (hasValidMapBounds(f)) n++;
    return n;
  }

  // short — BNHUB
  if (f.priceMin > 0 || f.priceMax > 0) n++;
  if (f.checkIn?.trim()) n++;
  if (f.checkOut?.trim()) n++;
  if (f.guests != null && f.guests > 0) n++;
  n += f.features.length;
  return n;
}

/** BNHUB short-term listings — maps global filters to existing GET `/api/bnhub/listings` params. */
export function globalFiltersToBnhubParams(f: GlobalSearchFiltersExtended): URLSearchParams {
  const p = new URLSearchParams();
  if (f.location.trim()) p.set("city", f.location.trim());
  if (f.checkIn?.trim()) p.set("checkIn", f.checkIn.trim());
  if (f.checkOut?.trim()) p.set("checkOut", f.checkOut.trim());
  if (f.guests != null && f.guests > 0) p.set("guests", String(f.guests));
  if (f.priceMin > 0) p.set("minPrice", String(Math.round(f.priceMin)));
  if (f.priceMax > 0) p.set("maxPrice", String(Math.round(f.priceMax)));
  if (f.bedrooms != null && f.bedrooms >= 0) p.set("minBeds", String(f.bedrooms));
  if (f.bathrooms != null && f.bathrooms >= 0) p.set("minBaths", String(f.bathrooms));
  if (f.propertyType?.trim()) p.set("propertyType", f.propertyType.trim());
  if (f.roomType?.trim()) p.set("roomType", f.roomType.trim());
  if (f.features.includes("verified")) p.set("verifiedOnly", "true");
  if (f.features.includes("instant_book")) p.set("instantBook", "true");
  const sort = f.sort ?? "recommended";
  if (
    sort === "newest" ||
    sort === "priceAsc" ||
    sort === "priceDesc" ||
    sort === "recommended" ||
    sort === "ranking" ||
    sort === "ai"
  ) {
    p.set("sort", sort);
  }
  return p;
}
