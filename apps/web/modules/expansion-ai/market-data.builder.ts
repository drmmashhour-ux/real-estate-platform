/**
 * Builds `Market` rows from LECIPM `City` + internal supply/demand snapshot only.
 * No census, tourism boards, or third-party TAM — caps are normalization heuristics, not facts.
 */
import type { City, CityOperationProfile, PrismaClient } from "@prisma/client";
import { getCitySupplyDemandSnapshot, type CitySupplyDemandSnapshot } from "@/modules/multi-city/cityMetrics";
import type { Market } from "./market.types";

function envPositive(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function normBookings(bookings90d: number): number {
  const cap = envPositive("EXPANSION_AI_NORM_BOOKINGS_CAP", 50);
  return clamp01(bookings90d / cap);
}

function normLeads(leads90d: number): number {
  const cap = envPositive("EXPANSION_AI_NORM_LEADS_CAP", 120);
  return clamp01(leads90d / cap);
}

function normRevenueCents(cents: number): number {
  const cap = envPositive("EXPANSION_AI_NORM_REVENUE_CENTS", 10_000_000);
  return clamp01(cents / cap);
}

/** Higher = more crowded market (hosts + listings pressure). */
function competitionSaturation(s: CitySupplyDemandSnapshot): number {
  const listCap = envPositive("EXPANSION_AI_NORM_LISTINGS_CAP", 200);
  const hostCap = envPositive("EXPANSION_AI_NORM_HOSTS_CAP", 80);
  const listingPressure = clamp01(s.activeListings / listCap);
  const hostPressure = clamp01(s.hostsDistinct / hostCap);
  return clamp01(listingPressure * 0.55 + hostPressure * 0.45);
}

/** Lead + liquidity proxy for “real estate activity” (not external market size). */
function realEstateActivityProxy(s: CitySupplyDemandSnapshot): number {
  const leadN = normLeads(s.leads90d);
  const ratioCap = envPositive("EXPANSION_AI_NORM_BUYER_LISTING_RATIO", 6);
  const ratioN = clamp01(s.buyerToListingRatio / ratioCap);
  return clamp01(leadN * 0.55 + ratioN * 0.45);
}

function regulatoryFriction(
  city: City,
  profile: CityOperationProfile | null
): { friction: number; provenance: string } {
  if (profile) {
    const stage = profile.launchStage.toLowerCase();
    if (stage === "planned") {
      return { friction: 0.82, provenance: `city_operation_profiles.launchStage=${profile.launchStage}` };
    }
    if (stage === "pilot" || stage === "beta" || stage === "soft_launch") {
      return { friction: 0.52, provenance: `city_operation_profiles.launchStage=${profile.launchStage}` };
    }
    if (stage === "live" || stage === "active" || profile.isActive) {
      return { friction: 0.22, provenance: `city_operation_profiles (${profile.launchStage}, isActive)` };
    }
    return { friction: 0.45, provenance: `city_operation_profiles.launchStage=${profile.launchStage}` };
  }

  let friction = 0.42;
  const parts: string[] = [`status=${city.status}`];
  if (city.status === "testing") {
    friction += 0.1;
    parts.push("testing");
  }
  if (!city.listingsEnabled) {
    friction += 0.16;
    parts.push("listingsDisabled");
  }
  if (!city.searchPagesEnabled) friction += 0.06;
  if (!city.growthEngineEnabled) friction += 0.05;
  return {
    friction: clamp01(friction),
    provenance: `City flags only (no CityOperationProfile): ${parts.join(", ")}`,
  };
}

export function indexCityOperationProfiles(
  profiles: CityOperationProfile[]
): Map<string, CityOperationProfile> {
  const m = new Map<string, CityOperationProfile>();
  for (const p of profiles) {
    m.set(p.cityKey.toLowerCase(), p);
  }
  return m;
}

export function matchCityOperationProfile(
  city: City,
  byKey: Map<string, CityOperationProfile>
): CityOperationProfile | null {
  return byKey.get(city.slug.toLowerCase()) ?? byKey.get(city.id.toLowerCase()) ?? null;
}

export function marketFromCitySnapshot(
  city: City,
  snap: CitySupplyDemandSnapshot,
  profile: CityOperationProfile | null
): Market {
  const { friction, provenance: regProv } = regulatoryFriction(city, profile);
  const comp = competitionSaturation(snap);
  const provenance: string[] = [
    "getCitySupplyDemandSnapshot (90d bookings, leads, listings, hosts, revenue)",
    regProv,
    `normalization caps: EXPANSION_AI_NORM_* env (bookings/leads/listings/hosts/revenue/ratio)`,
  ];

  return {
    city: city.name,
    country: city.country,
    citySlug: city.slug,
    cityId: city.id,
    population: null,
    tourismDemand: normBookings(snap.bookings90d),
    realEstateActivity: realEstateActivityProxy(snap),
    competitionLevel: comp,
    regulatoryComplexity: friction,
    revenuePotential: normRevenueCents(snap.revenueCents90d),
    dataProvenance: provenance,
    launchStatus: city.status,
  };
}

export async function buildMarketsFromDatabase(
  db: PrismaClient,
  opts?: { cityStatuses?: string[] }
): Promise<Market[]> {
  const statuses = opts?.cityStatuses ?? ["testing", "active"];
  const cities = await db.city.findMany({
    where: { status: { in: statuses } },
    orderBy: [{ country: "asc" }, { name: "asc" }],
  });
  const profiles = await db.cityOperationProfile.findMany();
  const byKey = indexCityOperationProfiles(profiles);

  const markets: Market[] = [];
  for (const city of cities) {
    const snap = await getCitySupplyDemandSnapshot(db, city);
    const profile = matchCityOperationProfile(city, byKey);
    markets.push(marketFromCitySnapshot(city, snap, profile));
  }
  return markets;
}
