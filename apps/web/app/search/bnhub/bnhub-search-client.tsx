"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nContext";
import {
  normalizeAnyPublicListingCode,
  parseListingCodeFromSearchQuery,
} from "@/lib/listing-code-public";
import dynamic from "next/dynamic";
import type { MapListing } from "@/components/map/MapListing";
import { hasValidCoordinates } from "@/components/map/MapListing";
import type { MapDisplayMode } from "@/components/map/ListingMap";

const ListingMap = dynamic(
  () => import("@/components/map/ListingMap").then((m) => m.ListingMap),
  { ssr: false }
);

type Listing = {
  id: string;
  listingCode?: string | null;
  title: string;
  city: string;
  nightPriceCents: number;
  photos: string[] | unknown;
  latitude?: number | null;
  longitude?: number | null;
  verificationStatus?: string;
  maxGuests?: number;
  beds?: number;
  baths?: number;
  propertyType?: string | null;
  roomType?: string | null;
  createdAt?: string;
  amenities?: unknown;
  _count?: { reviews: number; bookings?: number };
  reviews?: { propertyRating: number }[];
  _aiScore?: number;
  _aiLabels?: ("Best Match" | "Great Price" | "High Demand")[];
  _conversionBadges?: {
    isNew?: boolean;
    isFeatured?: boolean;
    priceDrop?: boolean;
  };
};

export type SortOption =
  | "ai_best_match"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "most_viewed";

export type BnhubFilters = {
  location: string;
  listingCode: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  adults: number;
  children: number;
  priceMin: string;
  priceMax: string;
  propertyType: string;
  roomType: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  amenities: string[];
  /** Trust filter: only listings with verificationStatus VERIFIED */
  verifiedOnly: boolean;
  sort: SortOption;
  radiusKm: string;
  centerLat: string;
  centerLng: string;
};

const RECENT_SEARCHES_KEY = "bnhub_recent_searches_v1";
const SAVED_SEARCHES_KEY = "bnhub_saved_searches_v1";
const MAX_RECENT = 8;

function logListingCardClick(listingId: string, position?: number) {
  fetch("/api/ai/activity", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: "funnel_listing_card_click",
      listingId,
      metadata: { source: "bnhub_search_results", position },
    }),
  }).catch(() => {});
}

function logSearchAnalytics(
  searchQuery: string,
  meta?: { sort?: string; filters?: Record<string, string | boolean | undefined> }
) {
  fetch("/api/ai/activity", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: "search",
      searchQuery: searchQuery.slice(0, 500),
      metadata: meta
        ? {
            source: "bnhub_search",
            sort: meta.sort,
            ...meta.filters,
          }
        : { source: "bnhub_search" },
    }),
  }).catch(() => {});
}

function pushRecentSearch(label: string) {
  const t = label.trim();
  if (t.length < 2) return;
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    const prev: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function loadSavedSearches(): { name: string; params: string }[] {
  try {
    const raw = localStorage.getItem(SAVED_SEARCHES_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is { name: string; params: string } => typeof x?.name === "string" && typeof x?.params === "string")
      .slice(0, 20);
  } catch {
    return [];
  }
}

function saveSearchToStorage(name: string, params: string) {
  try {
    const cur = loadSavedSearches();
    const next = [{ name: name.slice(0, 80), params }, ...cur.filter((s) => s.params !== params)].slice(0, 20);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

function mergeLocationIntoFilters(f: BnhubFilters, raw: string): BnhubFilters {
  const t = raw.trim();
  const code = normalizeAnyPublicListingCode(t);
  if (code) return { ...f, listingCode: code, location: "" };
  return { ...f, listingCode: "", location: t };
}

/** Static location suggestions (typeahead). */
const LOCATION_SUGGESTIONS = [
  "Montreal",
  "Laval",
  "Toronto",
  "Quebec City",
  "Ottawa",
  "Vancouver",
  "Calgary",
  "Halifax",
  "Victoria",
  "Winnipeg",
];

const PROPERTY_TYPES = [
  { value: "", label: "Any type" },
  { value: "House", label: "House" },
  { value: "Apartment", label: "Apartment" },
  { value: "Condo", label: "Condo" },
  { value: "Villa", label: "Villa" },
  { value: "Cabin", label: "Cabin" },
  { value: "Other", label: "Other" },
];

const AMENITY_OPTIONS = [
  { id: "wifi", label: "Wifi" },
  { id: "parking", label: "Parking" },
  { id: "kitchen", label: "Kitchen" },
  { id: "air conditioning", label: "Air conditioning" },
];

const defaultFilters: BnhubFilters = {
  location: "",
  listingCode: "",
  checkIn: "",
  checkOut: "",
  guests: 0,
  adults: 0,
  children: 0,
  priceMin: "",
  priceMax: "",
  propertyType: "",
  roomType: "",
  bedrooms: "",
  beds: "",
  bathrooms: "",
  amenities: [],
  verifiedOnly: false,
  sort: "ai_best_match",
  radiusKm: "",
  centerLat: "",
  centerLng: "",
};

const ROOM_TYPES = [
  { value: "", label: "Any room type" },
  { value: "Entire place", label: "Entire place" },
  { value: "Private room", label: "Private room" },
  { value: "Shared room", label: "Shared room" },
];

const RADIUS_OPTIONS = [
  { value: "", label: "No radius filter" },
  { value: "5", label: "Within 5 km" },
  { value: "15", label: "Within 15 km" },
  { value: "50", label: "Within 50 km" },
];

function getPhotoUrls(photos: string[] | unknown): string[] {
  if (Array.isArray(photos)) {
    return photos.filter((p): p is string => typeof p === "string");
  }
  return [];
}

function getRating(listing: Listing): string | null {
  const reviews = listing.reviews;
  if (reviews && reviews.length > 0) {
    const avg =
      reviews.reduce((s, r) => s + r.propertyRating, 0) / reviews.length;
    return avg.toFixed(1);
  }
  if (listing._count?.reviews && listing._count.reviews > 0) return "—";
  return null;
}

function hasAmenity(listing: Listing, amenity: string): boolean {
  const a = listing.amenities;
  if (!Array.isArray(a)) return false;
  return a.some(
    (x) => typeof x === "string" && x.toLowerCase().includes(amenity.toLowerCase())
  );
}


function filtersToParams(filters: BnhubFilters, page: number): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.listingCode.trim()) params.set("listingCode", filters.listingCode.trim());
  else if (filters.location.trim()) params.set("location", filters.location.trim());
  if (filters.checkIn) params.set("checkIn", filters.checkIn);
  if (filters.checkOut) params.set("checkOut", filters.checkOut);
  const totalGuests = filters.adults + filters.children;
  if (totalGuests > 0) params.set("guests", String(totalGuests));
  if (filters.priceMin) params.set("minPrice", filters.priceMin);
  if (filters.priceMax) params.set("maxPrice", filters.priceMax);
  if (filters.propertyType) params.set("propertyType", filters.propertyType);
  if (filters.roomType) params.set("roomType", filters.roomType);
  const minBedsNum = [filters.beds, filters.bedrooms]
    .map((x) => parseInt(String(x), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
  if (minBedsNum.length > 0) params.set("minBeds", String(Math.max(...minBedsNum)));
  if (filters.bathrooms) params.set("minBaths", filters.bathrooms);
  if (filters.radiusKm && filters.centerLat && filters.centerLng) {
    params.set("radiusKm", filters.radiusKm);
    params.set("centerLat", filters.centerLat);
    params.set("centerLng", filters.centerLng);
  }
  if (filters.verifiedOnly) params.set("verifiedOnly", "true");
  params.set("sort", filters.sort);
  params.set("page", String(page));
  params.set("limit", String(PAGE_SIZE));
  return params;
}

function paramsToFilters(searchParams: URLSearchParams): BnhubFilters {
  let adults = parseInt(searchParams.get("adults") ?? "", 10);
  let children = parseInt(searchParams.get("children") ?? "", 10);
  if (Number.isNaN(adults) || Number.isNaN(children)) {
    const guests = parseInt(searchParams.get("guests") ?? "0", 10) || 0;
    adults = guests;
    children = 0;
  }
  const sortRaw = searchParams.get("sort") as SortOption | null;
  const sortOk: SortOption =
    sortRaw === "price_asc" ||
    sortRaw === "price_desc" ||
    sortRaw === "newest" ||
    sortRaw === "most_viewed"
      ? sortRaw
      : "ai_best_match";

  return {
    ...defaultFilters,
    location: searchParams.get("location") ?? "",
    listingCode: searchParams.get("listingCode") ?? "",
    checkIn: searchParams.get("checkIn") ?? "",
    checkOut: searchParams.get("checkOut") ?? "",
    adults: Number.isNaN(adults) ? 0 : adults,
    children: Number.isNaN(children) ? 0 : children,
    guests: (Number.isNaN(adults) ? 0 : adults) + (Number.isNaN(children) ? 0 : children),
    priceMin: searchParams.get("priceMin") ?? searchParams.get("minPrice") ?? "",
    priceMax: searchParams.get("priceMax") ?? searchParams.get("maxPrice") ?? "",
    propertyType: searchParams.get("propertyType") ?? "",
    roomType: searchParams.get("roomType") ?? "",
    bedrooms: searchParams.get("bedrooms") ?? "",
    beds: searchParams.get("minBeds") ?? "",
    bathrooms: searchParams.get("minBaths") ?? "",
    sort: sortOk,
    radiusKm: searchParams.get("radiusKm") ?? "",
    centerLat: searchParams.get("centerLat") ?? "",
    centerLng: searchParams.get("centerLng") ?? "",
    verifiedOnly:
      searchParams.get("verifiedOnly") === "true" ||
      searchParams.get("verified_only") === "true",
  };
}

/** In-memory cache: key = query string (no page), value = map of page -> result. */
const searchCache = new Map<string, Map<number, { data: Listing[]; total: number; hasMore: boolean }>>();

export function BnhubSearchClient() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filters, setFilters] = useState<BnhubFilters>(defaultFilters);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("map");
  const [mapDisplayMode, setMapDisplayMode] = useState<MapDisplayMode>("markers");
  const [openDropdown, setOpenDropdown] = useState<
    "location" | "dates" | "guests" | "price" | "filters" | null
  >(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [suggestCities, setSuggestCities] = useState<string[]>([]);
  const [suggestListings, setSuggestListings] = useState<
    { id: string; listingCode: string; title: string; city: string; nightPriceCents: number }[]
  >([]);
  const [nlBusy, setNlBusy] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedRefresh, setSavedRefresh] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersRef = useRef(filters);
  const locationInputRef = useRef(locationInput);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  filtersRef.current = filters;
  locationInputRef.current = locationInput;

  useEffect(() => {
    setQuery(locationInput);
  }, [locationInput]);

  const syncUrl = useCallback(
    (nextFilters: BnhubFilters) => {
      const params = new URLSearchParams();
      if (nextFilters.listingCode.trim()) params.set("listingCode", nextFilters.listingCode.trim());
      else if (nextFilters.location) params.set("location", nextFilters.location);
      if (nextFilters.checkIn) params.set("checkIn", nextFilters.checkIn);
      if (nextFilters.checkOut) params.set("checkOut", nextFilters.checkOut);
      if (nextFilters.adults > 0) params.set("adults", String(nextFilters.adults));
      if (nextFilters.children > 0) params.set("children", String(nextFilters.children));
      if (nextFilters.priceMin) params.set("priceMin", nextFilters.priceMin);
      if (nextFilters.priceMax) params.set("priceMax", nextFilters.priceMax);
      if (nextFilters.propertyType) params.set("propertyType", nextFilters.propertyType);
      if (nextFilters.roomType) params.set("roomType", nextFilters.roomType);
      if (nextFilters.radiusKm && nextFilters.centerLat && nextFilters.centerLng) {
        params.set("radiusKm", nextFilters.radiusKm);
        params.set("centerLat", nextFilters.centerLat);
        params.set("centerLng", nextFilters.centerLng);
      }
      if (nextFilters.verifiedOnly) params.set("verifiedOnly", "true");
      if (nextFilters.sort !== "ai_best_match") params.set("sort", nextFilters.sort);
      const q = params.toString();
      const path = q ? `/search/bnhub?${q}` : "/search/bnhub";
      router.replace(path, { scroll: false });
    },
    [router]
  );

  const runSearch = useCallback(
    (pageNum: number = 1, append: boolean = false, filtersOverride?: BnhubFilters) => {
      const f =
        filtersOverride ?? mergeLocationIntoFilters(filters, locationInput);
      const params = filtersToParams(f, pageNum);
      const queryString = params.toString();
      const cacheKey = queryString.replace(/[?&]page=\d+/, "").replace(/^&/, "") || "default";

      const cached = searchCache.get(cacheKey)?.get(pageNum);
      if (cached && !append && pageNum === 1) {
        setListings(cached.data);
        setTotal(cached.total);
        setHasMore(cached.hasMore);
        setPage(1);
        setLoading(false);
        return;
      }
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      fetch(`/api/bnhub/search?${queryString}`)
        .then((res) => res.json())
        .then((json) => {
          const data: Listing[] = Array.isArray(json.data) ? json.data : [];
          const totalCount = typeof json.total === "number" ? json.total : 0;
          const hasMoreNext = Boolean(json.hasMore);

          logSearchAnalytics(queryString, {
            sort: f.sort,
            filters: {
              hasLocation: Boolean(f.location.trim() || f.listingCode.trim()),
              propertyType: f.propertyType || undefined,
              roomType: f.roomType || undefined,
              radiusKm: f.radiusKm || undefined,
              priceMin: f.priceMin || undefined,
              priceMax: f.priceMax || undefined,
              verifiedOnly: f.verifiedOnly || undefined,
            },
          });
          pushRecentSearch(f.listingCode.trim() || f.location.trim());

          if (f.amenities.length > 0) {
            const filtered = data.filter((listing: Listing) =>
              f.amenities.every((a) => hasAmenity(listing, a))
            );
            if (append) setListings((prev) => [...prev, ...filtered]);
            else setListings(filtered);
          } else {
            if (append) setListings((prev) => [...prev, ...data]);
            else setListings(data);
          }
          setTotal(totalCount);
          setHasMore(hasMoreNext);
          setPage(pageNum);

          if (!searchCache.has(cacheKey)) searchCache.set(cacheKey, new Map());
          searchCache.get(cacheKey)!.set(pageNum, { data, total: totalCount, hasMore: hasMoreNext });
          setRecentSearches(loadRecentSearches());
        })
        .catch(() => {
          if (!append) setListings([]);
        })
        .finally(() => {
          setLoading(false);
          setLoadingMore(false);
        });
    },
    [filters, locationInput]
  );

  useEffect(() => {
    const fromUrl = paramsToFilters(searchParams);
    setFilters(fromUrl);
    setLocationInput(fromUrl.listingCode.trim() ? fromUrl.listingCode : fromUrl.location);
    setRecentSearches(loadRecentSearches());
  }, [searchParams]);

  useEffect(() => {
    const q = locationInput.trim();
    if (q.length < 2) {
      setSuggestCities([]);
      setSuggestListings([]);
      return;
    }
    if (suggestRef.current) clearTimeout(suggestRef.current);
    suggestRef.current = setTimeout(() => {
      fetch(`/api/bnhub/search/suggest?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((j: { cities?: string[]; listings?: typeof suggestListings }) => {
          setSuggestCities(Array.isArray(j.cities) ? j.cities : []);
          setSuggestListings(Array.isArray(j.listings) ? j.listings : []);
        })
        .catch(() => {
          setSuggestCities([]);
          setSuggestListings([]);
        });
    }, 200);
    return () => {
      if (suggestRef.current) clearTimeout(suggestRef.current);
    };
  }, [locationInput]);

  const initialUrlRef = useRef<string | null>(null);
  useEffect(() => {
    const urlKey = searchParams.toString();
    if (initialUrlRef.current === null) {
      initialUrlRef.current = urlKey;
      const fromUrl = paramsToFilters(searchParams);
      setFilters(fromUrl);
      setLocationInput(fromUrl.listingCode.trim() ? fromUrl.listingCode : fromUrl.location);
      runSearch(1, false, fromUrl);
    } else if (initialUrlRef.current !== urlKey) {
      initialUrlRef.current = urlKey;
      const fromUrl = paramsToFilters(searchParams);
      setFilters(fromUrl);
      setLocationInput(fromUrl.listingCode.trim() ? fromUrl.listingCode : fromUrl.location);
      runSearch(1, false, fromUrl);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchParams.toString()]);

  const debouncedSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const merged = mergeLocationIntoFilters(
        filtersRef.current,
        locationInputRef.current
      );
      syncUrl(merged);
      runSearch(1, false, merged);
    }, SEARCH_DEBOUNCE_MS);
  }, [syncUrl, runSearch]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    runSearch(page + 1, true);
  }, [page, hasMore, loadingMore, runSearch]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const locationSuggestions = useMemo(() => {
    const q = locationInput.trim().toLowerCase();
    if (!q) return LOCATION_SUGGESTIONS;
    return LOCATION_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q));
  }, [locationInput]);

  const updateFilters = useCallback((patch: Partial<BnhubFilters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      if ("adults" in patch || "children" in patch) {
        next.guests = (next.adults ?? prev.adults) + (next.children ?? prev.children);
      }
      return next;
    });
  }, []);

  const applySmartSearch = useCallback(async () => {
    const q = locationInput.trim();
    if (!q) return;
    const codeOnly = parseListingCodeFromSearchQuery(q);
    if (codeOnly) {
      try {
        const res = await fetch(`/api/listings/resolve-code?code=${encodeURIComponent(codeOnly)}`);
        const data = (await res.json()) as { url?: string };
        if (res.ok && data.url) {
          router.push(data.url);
          return;
        }
      } catch {
        /* fall through to not-found */
      }
      router.push(`/listings/not-found?code=${encodeURIComponent(codeOnly)}`);
      return;
    }
    setNlBusy(true);
    try {
      const res = await fetch("/api/ai/search/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q, context: "nightly_stay" }),
      });
      const data = await res.json();
      const sf = data?.suggestedFilters ?? {};
      const base = mergeLocationIntoFilters(filters, locationInput);
      const next: BnhubFilters = {
        ...base,
        location: typeof sf.locationHint === "string" ? sf.locationHint : base.location,
        listingCode: typeof sf.locationHint === "string" ? "" : base.listingCode,
        propertyType:
          typeof sf.propertyTypeHint === "string" ? sf.propertyTypeHint : base.propertyType,
        priceMin:
          sf.priceMinCents != null ? String(Math.round(sf.priceMinCents / 100)) : base.priceMin,
        priceMax:
          sf.priceMaxCents != null ? String(Math.round(sf.priceMaxCents / 100)) : base.priceMax,
        sort:
          sf.sort === "price_asc"
            ? "price_asc"
            : sf.sort === "price_desc"
              ? "price_desc"
              : sf.sort === "newest"
                ? "newest"
                : base.sort,
      };
      setFilters(next);
      setLocationInput(next.listingCode.trim() ? next.listingCode : next.location);
      syncUrl(next);
      runSearch(1, false, next);
    } catch {
      const merged = mergeLocationIntoFilters(filters, locationInput);
      setFilters(merged);
      setLocationInput(merged.listingCode.trim() ? merged.listingCode : merged.location);
      syncUrl(merged);
      runSearch(1, false, merged);
    } finally {
      setNlBusy(false);
    }
  }, [filters, locationInput, router, syncUrl, runSearch]);

  const applySearch = useCallback(async () => {
    await applySmartSearch();
    setOpenDropdown(null);
    setMobileFiltersOpen(false);
  }, [applySmartSearch]);

  const handleSearch = useCallback(async () => {
    await applySearch();
  }, [applySearch]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = String(pos.coords.latitude);
        const lng = String(pos.coords.longitude);
        const base = mergeLocationIntoFilters(filters, locationInput);
        const next = {
          ...base,
          centerLat: lat,
          centerLng: lng,
          radiusKm: base.radiusKm || "15",
        };
        setFilters(next);
        syncUrl(next);
        runSearch(1, false, next);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10_000 }
    );
  }, [filters, locationInput, syncUrl, runSearch]);

  const clearAllFilters = useCallback(() => {
    setFilters(defaultFilters);
    setLocationInput("");
    setOpenDropdown(null);
    setMobileFiltersOpen(false);
    setPage(1);
    router.replace("/search/bnhub", { scroll: false });
    runSearch(1, false, defaultFilters);
  }, [router, runSearch]);

  const removeTag = useCallback(
    (key: string, value?: string) => {
      let next: BnhubFilters = { ...filters };
      if (key === "location" || key === "listingCode") {
        next = { ...filters, location: "", listingCode: "" };
        setLocationInput("");
      } else if (key === "checkIn") next = { ...filters, checkIn: "" };
      else if (key === "checkOut") next = { ...filters, checkOut: "" };
      else if (key === "guests") next = { ...filters, adults: 0, children: 0, guests: 0 };
      else if (key === "price") next = { ...filters, priceMin: "", priceMax: "" };
      else if (key === "propertyType") next = { ...filters, propertyType: "" };
      else if (key === "roomType") next = { ...filters, roomType: "" };
      else if (key === "radius") {
        next = { ...filters, radiusKm: "", centerLat: "", centerLng: "" };
      }       else if (key === "amenities" && value) {
        next = { ...filters, amenities: filters.amenities.filter((a) => a !== value) };
      } else if (key === "verifiedOnly") next = { ...filters, verifiedOnly: false };
      setFilters(next);
      syncUrl(next);
      runSearch(1, false, next);
    },
    [filters, syncUrl, runSearch]
  );

  const effectiveFilters = useMemo(
    () => mergeLocationIntoFilters(filters, locationInput),
    [filters, locationInput]
  );

  const activeTags = useMemo(() => {
    const tags: { key: string; label: string; value?: string }[] = [];
    if (effectiveFilters.listingCode.trim()) {
      tags.push({
        key: "listingCode",
        label: effectiveFilters.listingCode.trim(),
      });
    } else if (effectiveFilters.location.trim()) {
      tags.push({ key: "location", label: effectiveFilters.location.trim() });
    }
    if (filters.checkIn) {
      tags.push({ key: "checkIn", label: `Check-in ${filters.checkIn}` });
    }
    if (filters.checkOut) {
      tags.push({ key: "checkOut", label: `Check-out ${filters.checkOut}` });
    }
    if (filters.roomType) {
      tags.push({ key: "roomType", label: filters.roomType });
    }
    if (filters.radiusKm && filters.centerLat && filters.centerLng) {
      tags.push({ key: "radius", label: `Within ${filters.radiusKm} km` });
    }
    const g = filters.adults + filters.children;
    if (g > 0) {
      tags.push({ key: "guests", label: `${g} guest${g !== 1 ? "s" : ""}` });
    }
    if (filters.priceMin || filters.priceMax) {
      const lo = filters.priceMin ? `$${filters.priceMin}` : "Any";
      const hi = filters.priceMax ? `$${filters.priceMax}` : "Any";
      tags.push({ key: "price", label: `${lo} – ${hi}` });
    }
    if (filters.propertyType) {
      const pt = PROPERTY_TYPES.find((p) => p.value === filters.propertyType);
      tags.push({ key: "propertyType", label: pt?.label ?? filters.propertyType });
    }
    if (filters.verifiedOnly) {
      tags.push({ key: "verifiedOnly", label: "Verified only" });
    }
    filters.amenities.forEach((a) => {
      const opt = AMENITY_OPTIONS.find((o) => o.id === a);
      tags.push({ key: "amenities", label: opt?.label ?? a, value: a });
    });
    return tags;
  }, [filters, effectiveFilters]);

  const hasActiveFilters = activeTags.length > 0;

  const filterBarButtons = useMemo(
    () => [
      {
        id: "location" as const,
        label: t("filters_location"),
        summary:
          effectiveFilters.listingCode.trim() ||
          effectiveFilters.location.trim() ||
          t("filters_locationSummaryPlaceholder"),
      },
      {
        id: "dates" as const,
        label: t("filters_dates"),
        summary:
          filters.checkIn && filters.checkOut
            ? `${filters.checkIn} → ${filters.checkOut}`
            : t("filters_addDates"),
      },
      {
        id: "guests" as const,
        label: t("filters_guests"),
        summary:
          filters.adults + filters.children > 0
            ? t("filters_guestsCount", { count: filters.adults + filters.children })
            : t("filters_addGuests"),
      },
      {
        id: "price" as const,
        label: t("filters_price"),
        summary:
          filters.priceMin || filters.priceMax
            ? `$${filters.priceMin || "0"} – $${filters.priceMax || t("filters_priceAny")}`
            : t("filters_addPrice"),
      },
      {
        id: "filters" as const,
        label: t("filters_filters"),
        summary: hasActiveFilters ? t("filters_filtersOn") : t("filters_advanced"),
      },
    ],
    [t, locale, effectiveFilters, filters, hasActiveFilters]
  );

  const mapListings: MapListing[] = useMemo(
    () =>
      listings
        .filter((l) => hasValidCoordinates(l))
        .map((l) => ({
          id: l.id,
          latitude: l.latitude!,
          longitude: l.longitude!,
          price: l.nightPriceCents / 100,
          title: l.title,
          image: getPhotoUrls(l.photos)[0] ?? null,
          href: `/bnhub/${l.listingCode || l.id}`,
        })),
    [listings]
  );

  const mapAvailable = mapListings.length > 0 || listings.length === 0;

  const applyLocationPick = useCallback(
    (raw: string, opts?: { listingCode?: string }) => {
      const base = filtersRef.current;
      const next: BnhubFilters = opts?.listingCode
        ? { ...base, listingCode: opts.listingCode, location: "" }
        : mergeLocationIntoFilters({ ...base, listingCode: "" }, raw);
      setFilters(next);
      setLocationInput(opts?.listingCode ?? raw);
      setOpenDropdown(null);
      syncUrl(next);
      runSearch(1, false, next);
    },
    [syncUrl, runSearch]
  );

  const saveCurrentSearch = useCallback(() => {
    const name =
      typeof window !== "undefined" ? window.prompt("Name this saved search") : null;
    if (!name?.trim()) return;
    const merged = mergeLocationIntoFilters(filters, locationInput);
    const p = filtersToParams(merged, 1);
    p.delete("page");
    p.delete("limit");
    saveSearchToStorage(name.trim(), p.toString());
    setSavedRefresh((x) => x + 1);
  }, [filters, locationInput]);

  const savedList = useMemo(
    () => (savedOpen ? loadSavedSearches() : []),
    [savedOpen, savedRefresh]
  );

  const dropdownContent = (
    <>
      {/* Location + suggestions */}
      {openDropdown === "location" && (
        <div className="w-[min(100vw-2rem,420px)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            City, postal code, or listing ID
          </label>
          <input
            type="text"
            placeholder="e.g. Laval, H2X 1Y1, LEC-10001"
            value={locationInput}
            onChange={(e) => {
              const v = e.target.value;
              setLocationInput(v);
              debouncedSearch();
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
            autoFocus
          />
          <p className="mt-1 text-xs text-slate-500">
            Autocomplete: cities & listings · recent searches below
          </p>
          {recentSearches.length > 0 && locationInput.trim().length < 2 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                Recent
              </p>
              <ul className="max-h-36 overflow-y-auto rounded-lg border border-slate-100">
                {recentSearches.slice(0, 6).map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => applyLocationPick(s)}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {suggestListings.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                Listings
              </p>
              <ul className="max-h-40 overflow-y-auto rounded-lg border border-slate-100">
                {suggestListings.slice(0, 6).map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() =>
                        applyLocationPick(row.listingCode, { listingCode: row.listingCode })
                      }
                    >
                      <span className="font-medium">{row.listingCode}</span>
                      <span className="text-slate-500"> · {row.title}</span>
                      <span className="block text-xs text-slate-400">{row.city}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {suggestCities.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                Cities
              </p>
              <ul className="max-h-40 overflow-y-auto rounded-lg border border-slate-100">
                {suggestCities.slice(0, 8).map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => applyLocationPick(s)}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {locationSuggestions.length > 0 && suggestCities.length === 0 && (
            <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-100">
              {locationSuggestions.slice(0, 8).map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => applyLocationPick(s)}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Dates */}
      {openDropdown === "dates" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Check-in
              </label>
              <input
                type="date"
                value={filters.checkIn}
                onChange={(e) => updateFilters({ checkIn: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Check-out
              </label>
              <input
                type="date"
                value={filters.checkOut}
                onChange={(e) => updateFilters({ checkOut: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* Guests */}
      {openDropdown === "guests" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Adults</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateFilters({ adults: Math.max(0, filters.adults - 1) })
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  −
                </button>
                <span className="min-w-[1.5rem] text-center">
                  {filters.adults}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateFilters({ adults: filters.adults + 1 })
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                Children
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateFilters({
                      children: Math.max(0, filters.children - 1),
                    })
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  −
                </button>
                <span className="min-w-[1.5rem] text-center">
                  {filters.children}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateFilters({ children: filters.children + 1 })
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price */}
      {openDropdown === "price" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Price per night ($)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={filters.priceMin}
              onChange={(e) => updateFilters({ priceMin: e.target.value })}
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
            />
            <span className="text-slate-400">–</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={filters.priceMax}
              onChange={(e) => updateFilters({ priceMax: e.target.value })}
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
            />
          </div>
        </div>
      )}

      {/* Advanced filters */}
      {openDropdown === "filters" && (
        <div className="max-h-[70vh] w-[320px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Property type
              </label>
              <select
                value={filters.propertyType}
                onChange={(e) =>
                  updateFilters({ propertyType: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              >
                {PROPERTY_TYPES.map((opt) => (
                  <option key={opt.value || "any"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Bedrooms (min)
              </label>
              <input
                type="number"
                min={0}
                placeholder="Any"
                value={filters.bedrooms}
                onChange={(e) =>
                  updateFilters({ bedrooms: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Beds (min)
              </label>
              <input
                type="number"
                min={0}
                placeholder="Any"
                value={filters.beds}
                onChange={(e) => updateFilters({ beds: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Bathrooms (min)
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                placeholder="Any"
                value={filters.bathrooms}
                onChange={(e) =>
                  updateFilters({ bathrooms: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Room type
              </label>
              <select
                value={filters.roomType}
                onChange={(e) => updateFilters({ roomType: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              >
                {ROOM_TYPES.map((opt) => (
                  <option key={opt.value || "any-room"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-800">Verified listings only</p>
                <p className="text-xs text-slate-500">Show places that passed BNHub verification</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={filters.verifiedOnly}
                onClick={() => {
                  const merged = mergeLocationIntoFilters(filters, locationInput);
                  const next = { ...merged, verifiedOnly: !filters.verifiedOnly };
                  setFilters(next);
                  setLocationInput(next.listingCode.trim() ? next.listingCode : next.location);
                  syncUrl(next);
                  runSearch(1, false, next);
                }}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  filters.verifiedOnly ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    filters.verifiedOnly ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Radius from map center
              </label>
              <select
                value={filters.radiusKm}
                onChange={(e) => updateFilters({ radiusKm: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              >
                {RADIUS_OPTIONS.map((opt) => (
                  <option key={opt.value || "no-rad"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={useMyLocation}
                className="mt-2 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Use my location as center
              </button>
              {filters.centerLat && filters.centerLng && (
                <p className="mt-1 text-xs text-slate-500">
                  Center set · adjust radius above (requires both center + radius to filter)
                </p>
              )}
            </div>
            <div className="rounded-lg border border-dashed border-slate-200 p-3">
              <p className="text-sm font-medium text-slate-800">Buy / long-term rent</p>
              <p className="mt-1 text-xs text-slate-500">
                Nightly stays stay here. For sale / lease listings, open Projects search.
              </p>
              <Link
                href="/projects"
                className="mt-2 inline-block text-sm font-semibold text-rose-600 hover:text-rose-700"
              >
                Go to projects →
              </Link>
            </div>
            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Amenities
              </span>
              <div className="space-y-2">
                {AMENITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.amenities.includes(opt.id)}
                      onChange={(e) => {
                        setFilters((prev) => ({
                          ...prev,
                          amenities: e.target.checked
                            ? [...prev.amenities, opt.id]
                            : prev.amenities.filter((a) => a !== opt.id),
                        }));
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400"
                    />
                    <span className="text-sm text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div ref={containerRef} className="min-h-screen">
      {/* Hero — smart search */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <h1 className="text-center text-2xl font-semibold text-slate-900 sm:text-3xl">
            {t("search_heroTitle")}
          </h1>
          <p className="mt-2 text-center text-slate-600">
            {t("search_heroSubtitle")}
          </p>
          <div className="mx-auto mt-8 max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                type="search"
                aria-label={t("a11y_searchStays")}
                placeholder={t("search_placeholder")}
                value={query}
                onChange={(e) => {
                  const nextQuery = e.target.value;
                  setQuery(nextQuery);
                  setLocationInput(nextQuery);
                  debouncedSearch();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void applySearch();
                  }
                }}
                className="min-h-[52px] flex-1 rounded-xl border border-slate-200 px-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
              />
              <button
                type="button"
                onClick={() => void handleSearch()}
                className="min-h-[52px] shrink-0 rounded-xl bg-rose-500 px-8 text-base font-semibold text-white hover:bg-rose-600 sm:px-10"
              >
                {nlBusy ? t("search_searching") : t("search_button")}
              </button>
            </div>
            {recentSearches.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="w-full text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t("search_recent")}
                </span>
                {recentSearches.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => applyLocationPick(s)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 hover:border-rose-200 hover:bg-rose-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-sm">
              <button
                type="button"
                onClick={saveCurrentSearch}
                className="font-semibold text-rose-600 hover:text-rose-700"
              >
                {t("search_saveThisSearch")}
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setSavedOpen(true)}
                className="font-medium text-slate-600 hover:text-slate-900"
              >
                {t("search_savedSearches")}
              </button>
              <span className="text-slate-300">|</span>
              <Link href="/projects" className="font-medium text-slate-600 hover:text-slate-900">
                {t("search_buyRentProjects")}
              </Link>
              <p className="w-full text-xs text-slate-500">
                {t("search_alertsNote")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filter bar (desktop: dropdowns) */}
      <section className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          {/* Desktop: horizontal buttons + dropdowns */}
          <div className="hidden lg:block">
            <div className="flex flex-wrap items-center gap-2">
              {filterBarButtons.map((btn) => (
                <div key={btn.id} className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === btn.id ? null : btn.id)
                    }
                    className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                      openDropdown === btn.id
                        ? "border-slate-900 bg-slate-900 text-white shadow"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <span>{btn.label}</span>
                    <span className="max-w-[120px] truncate text-slate-500">
                      · {btn.summary}
                    </span>
                  </button>
                  {openDropdown === btn.id && (
                    <div className="absolute left-0 top-full z-20 mt-2">
                      {dropdownContent}
                      <button
                        type="button"
                        onClick={applySearch}
                        className="mt-3 w-full rounded-lg bg-rose-500 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={applySearch}
                className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"
              >
                Apply filters
              </button>
            </div>
          </div>

          {/* Mobile: single "Filters" button → full-screen modal */}
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 shadow-sm"
            >
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-600">
                  {activeTags.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={applySearch}
              className="rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white"
            >
              Apply filters
            </button>
          </div>

          {/* Filter tags */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {activeTags.map((tag) => (
                <span
                  key={`${tag.key}-${tag.label}-${tag.value ?? ""}`}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-1.5 text-sm text-slate-700"
                >
                  {tag.label}
                  <button
                    type="button"
                    onClick={() =>
                      tag.key === "price"
                        ? removeTag("price")
                        : tag.key === "amenities" && tag.value
                          ? removeTag("amenities", tag.value)
                          : removeTag(tag.key)
                    }
                    className="rounded-full p-0.5 hover:bg-slate-200"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-sm font-medium text-rose-500 hover:text-rose-600"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Mobile full-screen filters modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="text-slate-600"
            >
              Close
            </button>
            <span className="font-semibold text-slate-900">Filters</span>
            <button
              type="button"
              onClick={() => {
                applySearch();
                setMobileFiltersOpen(false);
              }}
              className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Apply filters
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City, postal, or LEC-#####"
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    debouncedSearch();
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900"
                />
                {recentSearches.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recentSearches.slice(0, 4).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => applyLocationPick(s)}
                        className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={filters.checkIn}
                    onChange={(e) =>
                      updateFilters({ checkIn: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={filters.checkOut}
                    onChange={(e) =>
                      updateFilters({ checkOut: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Guests
                </label>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <span>Adults</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateFilters({
                          adults: Math.max(0, filters.adults - 1),
                        })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300"
                    >
                      −
                    </button>
                    <span>{filters.adults}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateFilters({ adults: filters.adults + 1 })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <span>Children</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateFilters({
                          children: Math.max(0, filters.children - 1),
                        })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300"
                    >
                      −
                    </button>
                    <span>{filters.children}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateFilters({ children: filters.children + 1 })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Price per night ($)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={(e) =>
                      updateFilters({ priceMin: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={(e) =>
                      updateFilters({ priceMax: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Property type
                </label>
                <select
                  value={filters.propertyType}
                  onChange={(e) =>
                    updateFilters({ propertyType: e.target.value })
                  }
                  className="w-full min-h-[48px] rounded-lg border border-slate-200 px-3 py-2.5 text-base"
                >
                  {PROPERTY_TYPES.map((opt) => (
                    <option key={opt.value || "any"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Room type
                </label>
                <select
                  value={filters.roomType}
                  onChange={(e) => updateFilters({ roomType: e.target.value })}
                  className="w-full min-h-[48px] rounded-lg border border-slate-200 px-3 py-2.5 text-base"
                >
                  {ROOM_TYPES.map((opt) => (
                    <option key={opt.value || "any-room"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">Verified listings only</p>
                  <p className="text-xs text-slate-500">BNHub verified hosts & listings</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={filters.verifiedOnly}
                  onClick={() => {
                    const merged = mergeLocationIntoFilters(filters, locationInput);
                    const next = { ...merged, verifiedOnly: !filters.verifiedOnly };
                    setFilters(next);
                    setLocationInput(next.listingCode.trim() ? next.listingCode : next.location);
                    syncUrl(next);
                    runSearch(1, false, next);
                  }}
                  className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                    filters.verifiedOnly ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      filters.verifiedOnly ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Radius
                </label>
                <select
                  value={filters.radiusKm}
                  onChange={(e) => updateFilters({ radiusKm: e.target.value })}
                  className="w-full min-h-[48px] rounded-lg border border-slate-200 px-3 py-2.5 text-base"
                >
                  {RADIUS_OPTIONS.map((opt) => (
                    <option key={opt.value || "no-rad"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={useMyLocation}
                  className="mt-2 w-full min-h-[48px] rounded-lg border border-slate-200 text-sm font-medium text-slate-700"
                >
                  Use my location
                </button>
              </div>
              <Link
                href="/projects"
                className="block rounded-lg border border-dashed border-slate-300 py-3 text-center text-sm font-semibold text-rose-600"
              >
                Buy / rent — open projects
              </Link>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Bedrooms (min)
                </label>
                <input
                  type="number"
                  min={0}
                  value={filters.bedrooms}
                  onChange={(e) =>
                    updateFilters({ bedrooms: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Beds (min)
                </label>
                <input
                  type="number"
                  min={0}
                  value={filters.beds}
                  onChange={(e) =>
                    updateFilters({ beds: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Bathrooms (min)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={filters.bathrooms}
                  onChange={(e) =>
                    updateFilters({ bathrooms: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                />
              </div>
              <div>
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Amenities
                </span>
                <div className="space-y-2">
                  {AMENITY_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={filters.amenities.includes(opt.id)}
                        onChange={(e) => {
                          setFilters((prev) => ({
                            ...prev,
                            amenities: e.target.checked
                              ? [...prev.amenities, opt.id]
                              : prev.amenities.filter((a) => a !== opt.id),
                          }));
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-rose-500"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <button
          type="button"
          className="fixed inset-0 z-10 lg:block"
          aria-label="Close"
          onClick={() => setOpenDropdown(null)}
        />
      )}

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <div
            className={`min-w-0 flex-1 lg:max-w-[50%] ${viewMode === "list" ? "w-full" : ""}`}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-500">
                {total > 0 ? `${total} stay${total !== 1 ? "s" : ""} found` : "No stays yet"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode((v) => (v === "list" ? "map" : "list"))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:hidden"
                >
                  {viewMode === "list" ? "Show map" : "List only"}
                </button>
                <select
                value={filters.sort}
                onChange={(e) => {
                  const sort = e.target.value as SortOption;
                  const merged = mergeLocationIntoFilters(filters, locationInput);
                  const next = { ...merged, sort };
                  setFilters(next);
                  setLocationInput(next.listingCode.trim() ? next.listingCode : next.location);
                  syncUrl(next);
                  runSearch(1, false, next);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="ai_best_match">Best match</option>
                <option value="price_asc">Price: low → high</option>
                <option value="price_desc">Price: high → low</option>
                <option value="newest">New listings</option>
                <option value="most_viewed">Most viewed</option>
              </select>
            </div>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <div className="aspect-[4/3] animate-pulse bg-slate-200" />
                    <div className="space-y-2 p-4">
                      <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                      <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-12 text-center">
                <h2 className="text-lg font-semibold text-slate-900">
                  {t("search_noProperties")}
                </h2>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFilters(defaultFilters);
                      setLocationInput("");
                      setQuery("");
                      syncUrl(defaultFilters);
                      runSearch(1, false, defaultFilters);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {t("search_browseAll")}
                  </button>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
                  >
                    {t("search_clearFilters")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing, index) => {
                  const photos = getPhotoUrls(listing.photos);
                  const rating = getRating(listing);
                  const badges = listing._conversionBadges;
                  const href = `/bnhub/${listing.listingCode || listing.id}`;
                  return (
                    <Link
                      key={listing.id}
                      href={href}
                      onClick={() => logListingCardClick(listing.id, index)}
                      className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl border-2 border-slate-200 bg-white transition hover:border-rose-300 hover:shadow-xl active:scale-[0.99]"
                    >
                      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-slate-100">
                        {photos[0] ? (
                          <img
                            src={photos[0]}
                            alt=""
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            No photo
                          </div>
                        )}
                        <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1.5 text-sm font-semibold text-slate-900 shadow-md">
                          $
                          {(listing.nightPriceCents / 100).toFixed(0)}
                          <span className="font-normal text-slate-500">
                            {" "}
                            / night
                          </span>
                        </span>
                        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                          {badges?.isNew ? (
                            <span className="rounded-md bg-violet-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                              New
                            </span>
                          ) : null}
                          {badges?.isFeatured ? (
                            <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-900">
                              Featured
                            </span>
                          ) : null}
                          {badges?.priceDrop ? (
                            <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                              Price drop
                            </span>
                          ) : null}
                        </div>
                        <div className="absolute right-3 top-3 flex max-w-[55%] flex-col items-end gap-1">
                          {(listing._aiLabels ?? []).map((label) => (
                            <span
                              key={label}
                              className={`rounded-lg px-2.5 py-1 text-xs font-medium text-white shadow ${
                                label === "Best Match"
                                  ? "bg-rose-500"
                                  : label === "Great Price"
                                    ? "bg-emerald-500"
                                    : "bg-amber-500"
                              }`}
                            >
                              {label}
                            </span>
                          ))}
                          {listing.verificationStatus === "VERIFIED" && (
                            <span className="rounded-lg bg-slate-700 px-2.5 py-1 text-xs font-medium text-white">
                              Verified Host
                            </span>
                          )}
                          <span className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">
                            Protected Booking
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h2 className="line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-rose-600">
                          {listing.title}
                        </h2>
                        <p className="mt-1 text-sm font-medium text-slate-700">{listing.city}</p>
                        {listing.propertyType ? (
                          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                            {listing.propertyType}
                            {listing.roomType ? ` · ${listing.roomType}` : ""}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm text-slate-600">
                          {listing.beds != null || listing.baths != null
                            ? `${listing.beds ?? "?"} bed${(listing.beds ?? 0) !== 1 ? "s" : ""} · ${listing.baths ?? "?"} bath${(listing.baths ?? 0) !== 1 ? "s" : ""}`
                            : "—"}
                          {listing.maxGuests != null ? ` · ${listing.maxGuests} guests max` : ""}
                        </p>
                        {listing.listingCode ? (
                          <p className="mt-1 font-mono text-[11px] text-slate-400">ID {listing.listingCode}</p>
                        ) : null}
                        {rating !== null ? (
                          <p className="mt-2 text-xs text-slate-500">
                            ★ {rating}
                            {listing._count?.reviews != null &&
                              listing._count.reviews > 0 && (
                                <span className="ml-1">
                                  ({listing._count.reviews} review
                                  {listing._count.reviews !== 1 ? "s" : ""})
                                </span>
                              )}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-slate-400">
                            ★ — (no reviews yet)
                          </p>
                        )}
                        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-rose-600 group-hover:text-rose-700">
                          View details
                          <span aria-hidden>→</span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            {hasMore && <div ref={loadMoreRef} className="h-4" aria-hidden />}
            {loadingMore && (
              <div className="flex justify-center py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-rose-500" />
              </div>
            )}
          </div>

          <aside
            className={`sticky top-24 w-full shrink-0 lg:block lg:w-1/2 lg:max-w-[50%] ${
              viewMode === "map" ? "block" : "hidden"
            }`}
          >
            <div className="mb-2 flex flex-wrap items-center justify-end gap-2">
              <span className="mr-auto hidden text-xs text-slate-500 lg:inline">Map</span>
              <div
                className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs"
                role="group"
                aria-label="Map layer style"
              >
                <button
                  type="button"
                  onClick={() => setMapDisplayMode("markers")}
                  className={`rounded-md px-2.5 py-1 font-medium ${
                    mapDisplayMode === "markers"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  Markers
                </button>
                <button
                  type="button"
                  onClick={() => setMapDisplayMode("priceHeatmap")}
                  className={`rounded-md px-2.5 py-1 font-medium ${
                    mapDisplayMode === "priceHeatmap"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  Heatmap
                </button>
              </div>
            </div>
            <ListingMap
              listings={mapListings}
              displayMode={mapDisplayMode}
              showPriceLegend
              onMarkerClick={() => {}}
              disabled={!mapAvailable}
              className="h-[400px] lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]"
            />
          </aside>
        </div>
      </div>

      {/* Saved searches drawer */}
      {savedOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close saved searches"
            onClick={() => setSavedOpen(false)}
          />
          <div className="relative max-h-[85vh] w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="font-semibold text-slate-900">Saved searches</span>
              <button
                type="button"
                onClick={() => setSavedOpen(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {savedList.length === 0 ? (
                <p className="text-sm text-slate-500">No saved searches yet.</p>
              ) : (
                <ul className="space-y-2">
                  {savedList.map((s) => (
                    <li key={s.params}>
                      <button
                        type="button"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-rose-200 hover:bg-rose-50/50"
                        onClick={() => {
                          setSavedOpen(false);
                          router.push(`/search/bnhub?${s.params}`);
                        }}
                      >
                        <span className="font-medium text-slate-900">{s.name}</span>
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {s.params.replace(/&/g, " · ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
