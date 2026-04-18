/**
 * Approximate map coordinates for guest “home” country (from User.homeCountry).
 * Used when precise GPS is not stored — hosts still see where bookings originate regionally.
 */
const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  CA: { lat: 56.13, lng: -106.35 },
  US: { lat: 39.83, lng: -98.58 },
  FR: { lat: 46.23, lng: 2.21 },
  GB: { lat: 55.38, lng: -3.44 },
  DE: { lat: 51.16, lng: 10.45 },
  ES: { lat: 40.46, lng: -3.75 },
  IT: { lat: 41.87, lng: 12.57 },
  MA: { lat: 31.79, lng: -7.09 },
  DZ: { lat: 28.03, lng: 1.66 },
  TN: { lat: 33.89, lng: 9.56 },
  BE: { lat: 50.5, lng: 4.47 },
  CH: { lat: 46.82, lng: 8.23 },
  NL: { lat: 52.13, lng: 5.29 },
  PT: { lat: 39.4, lng: -8.22 },
  BR: { lat: -14.24, lng: -51.93 },
  MX: { lat: 23.63, lng: -102.55 },
  AU: { lat: -25.27, lng: 133.78 },
  IN: { lat: 20.59, lng: 78.96 },
  CN: { lat: 35.86, lng: 104.2 },
  JP: { lat: 36.2, lng: 138.25 },
  KR: { lat: 35.91, lng: 127.77 },
  AE: { lat: 23.42, lng: 53.85 },
  SA: { lat: 23.89, lng: 45.08 },
  QA: { lat: 25.35, lng: 51.18 },
  SY: { lat: 34.8, lng: 38.99 },
  LB: { lat: 33.85, lng: 35.86 },
  TR: { lat: 38.96, lng: 35.24 },
  RU: { lat: 61.52, lng: 105.32 },
  UA: { lat: 48.38, lng: 31.17 },
  PL: { lat: 51.92, lng: 19.15 },
  SE: { lat: 60.13, lng: 18.64 },
  NO: { lat: 60.47, lng: 8.47 },
  DK: { lat: 56.26, lng: 9.5 },
  FI: { lat: 61.92, lng: 25.75 },
  IE: { lat: 53.41, lng: -8.24 },
  GR: { lat: 39.07, lng: 21.82 },
};

const NAME_TO_ISO: Record<string, keyof typeof COUNTRY_CENTROIDS> = {
  canada: "CA",
  "united states": "US",
  usa: "US",
  france: "FR",
  "united kingdom": "GB",
  uk: "GB",
  england: "GB",
  germany: "DE",
  spain: "ES",
  italy: "IT",
  morocco: "MA",
  algeria: "DZ",
  tunisia: "TN",
  belgium: "BE",
  switzerland: "CH",
  netherlands: "NL",
  portugal: "PT",
  brazil: "BR",
  mexico: "MX",
  australia: "AU",
  india: "IN",
  china: "CN",
  japan: "JP",
  "south korea": "KR",
  korea: "KR",
  "united arab emirates": "AE",
  "saudi arabia": "SA",
  qatar: "QA",
  syria: "SY",
  lebanon: "LB",
  turkey: "TR",
  russia: "RU",
  ukraine: "UA",
  poland: "PL",
  sweden: "SE",
  norway: "NO",
  denmark: "DK",
  finland: "FI",
  ireland: "IE",
  greece: "GR",
};

export function normalizeCountryCode(raw: string | null | undefined): keyof typeof COUNTRY_CENTROIDS | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (t.length === 2) {
    const u = t.toUpperCase();
    return u in COUNTRY_CENTROIDS ? (u as keyof typeof COUNTRY_CENTROIDS) : null;
  }
  const key = t.toLowerCase();
  return NAME_TO_ISO[key] ?? null;
}

export function getCountryCentroid(iso: keyof typeof COUNTRY_CENTROIDS): { lat: number; lng: number } {
  return COUNTRY_CENTROIDS[iso] ?? COUNTRY_CENTROIDS.CA;
}

export type GuestOriginAggregate = {
  countryCode: string;
  label: string;
  count: number;
  lat: number;
  lng: number;
};

export function aggregateGuestOrigins(
  rows: Array<{ guest: { homeCountry?: string | null; homeRegion?: string | null; homeCity?: string | null } }>
): GuestOriginAggregate[] {
  const map = new Map<
    string,
    { count: number; sampleLabel: string; iso: keyof typeof COUNTRY_CENTROIDS | "UNKNOWN" }
  >();

  for (const row of rows) {
    const iso = normalizeCountryCode(row.guest.homeCountry ?? undefined);
    if (!iso) {
      const e =
        map.get("UNKNOWN") ?? { count: 0, sampleLabel: "Profile country not set", iso: "UNKNOWN" as const };
      e.count += 1;
      map.set("UNKNOWN", e);
      continue;
    }
    const e = map.get(iso) ?? { count: 0, sampleLabel: iso, iso };
    e.count += 1;
    const city = row.guest.homeCity?.trim();
    e.sampleLabel = city ? `${city}, ${iso}` : iso;
    map.set(iso, e);
  }

  const out: GuestOriginAggregate[] = [];
  for (const [key, v] of map) {
    if (v.iso === "UNKNOWN") {
      out.push({
        countryCode: "—",
        label: v.sampleLabel,
        count: v.count,
        lat: 25,
        lng: -40,
      });
    } else {
      const { lat, lng } = getCountryCentroid(v.iso);
      out.push({
        countryCode: key,
        label: v.sampleLabel,
        count: v.count,
        lat,
        lng,
      });
    }
  }
  return out.sort((a, b) => b.count - a.count);
}
