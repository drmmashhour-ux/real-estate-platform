import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

export type Listing = {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  price_per_night: number;
  cover_image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
  star_rating?: number | null;
  amenities_preview?: string[];
  /** Merged from Prisma `bnhub_listings` when ids match. */
  ratingAverage?: number | null;
  reviewCount?: number;
  completedStays?: number;
  hostVerified?: boolean;
  topHost?: boolean;
};

export type ListingFilters = {
  q?: string;
  /** Structured location (sent as query params; optional). */
  country?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  propertyType?: string;
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  minRating?: number;
  amenities?: string[];
};

function buildQueryString(filters: ListingFilters): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.country?.trim()) params.set("country", filters.country.trim());
  if (filters.city?.trim()) params.set("city", filters.city.trim());
  if (typeof filters.minPrice === "number" && Number.isFinite(filters.minPrice)) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (typeof filters.maxPrice === "number" && Number.isFinite(filters.maxPrice)) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (typeof filters.lat === "number" && Number.isFinite(filters.lat)) params.set("lat", String(filters.lat));
  if (typeof filters.lng === "number" && Number.isFinite(filters.lng)) params.set("lng", String(filters.lng));
  if (typeof filters.radiusKm === "number" && Number.isFinite(filters.radiusKm)) {
    params.set("radiusKm", String(filters.radiusKm));
  }
  if (filters.propertyType?.trim()) params.set("propertyType", filters.propertyType.trim());
  if (typeof filters.guests === "number" && Number.isFinite(filters.guests) && filters.guests > 0) {
    params.set("guests", String(Math.min(50, Math.floor(filters.guests))));
  }
  if (typeof filters.bedrooms === "number" && Number.isFinite(filters.bedrooms) && filters.bedrooms > 0) {
    params.set("bedrooms", String(Math.min(20, Math.floor(filters.bedrooms))));
  }
  if (typeof filters.bathrooms === "number" && Number.isFinite(filters.bathrooms) && filters.bathrooms > 0) {
    params.set("bathrooms", String(filters.bathrooms));
  }
  if (typeof filters.minRating === "number" && Number.isFinite(filters.minRating) && filters.minRating >= 1) {
    params.set("minRating", String(Math.min(5, Math.floor(filters.minRating))));
  }
  for (const a of filters.amenities ?? []) {
    if (a.trim()) params.append("amenities", a.trim());
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

/**
 * Guest browse via platform API — filters are applied server-side (`/api/bnhub/public/listings`).
 */
export function useListings(filters: ListingFilters = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    let active = true;

    async function fetchListings() {
      setLoading(true);
      setError(null);

      try {
        const qs = buildQueryString(JSON.parse(filterKey) as ListingFilters);
        const url = `${API_BASE_URL.replace(/\/$/, "")}/api/bnhub/public/listings${qs}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await res.json().catch(() => ({}))) as {
          listings?: Listing[];
          total?: number;
          error?: string;
        };
        if (!active) return;
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Unable to load stays. Please try again.");
          setListings([]);
          setTotal(0);
          setLoading(false);
          return;
        }
        const list = Array.isArray(data.listings) ? data.listings : [];
        setListings(list);
        setTotal(typeof data.total === "number" ? data.total : list.length);
        setError(null);
      } catch {
        if (!active) return;
        setError("Unable to load stays. Please try again.");
        setListings([]);
        setTotal(0);
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchListings();

    return () => {
      active = false;
    };
  }, [filterKey]);

  return { listings, total, loading, error };
}
