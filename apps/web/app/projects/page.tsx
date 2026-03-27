"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PhoneCallUs } from "@/components/phone/PhoneCallUs";
import {
  getProjectsPageCopy,
  PROJECTS_FILTER_LANG_STORAGE_KEY,
  type ProjectsFilterLang,
} from "@/lib/i18n/projects-page-copy";

const ProjectsMap = dynamic(
  () => import("@/components/projects/ProjectsMap").then((m) => m.ProjectsMap),
  { ssr: false, loading: () => <div className="flex h-[480px] items-center justify-center rounded-2xl bg-slate-900 text-slate-400">Loading map…</div> }
);

const ProjectsGoogleMap = dynamic(
  () => import("@/components/projects/ProjectsGoogleMap").then((m) => m.ProjectsGoogleMap),
  { ssr: false, loading: () => <div className="flex h-[480px] items-center justify-center rounded-2xl bg-slate-900 text-slate-400">Loading map…</div> }
);

const FEATURED_GOLD = "#C9A96E";

type Project = {
  id: string;
  name: string;
  description: string;
  city: string;
  address?: string;
  developer: string;
  deliveryDate: string;
  startingPrice: number;
  status: string;
  heroImage?: string | null;
  featured?: boolean | null;
  featuredUntil?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  subscription?: { plan?: string } | null;
  units?: { id: string; type: string; price: number; size: number; status: string }[];
};

function isFeatured(p: Project): boolean {
  if (p.subscription?.plan === "premium") return true;
  if (!p.featured) return false;
  if (p.featuredUntil) {
    try {
      if (new Date(p.featuredUntil) < new Date()) return false;
    } catch {}
  }
  return true;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR + i);
const CONSTRUCTION_YEARS = Array.from({ length: 130 }, (_, i) => CURRENT_YEAR - 100 + i).filter((y) => y >= 1900 && y <= CURRENT_YEAR + 2);

const PRICE_RANGE_MIN = 0;
const PRICE_RANGE_MAX = 20_000_000; // $20M
const PRICE_STEP = 50_000; // 50k steps

function formatPriceLabel(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}

const HAS_GOOGLE_MAPS_KEY = typeof process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === "string" &&
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.trim().length > 0;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");           // "" | residential | commercial
  const [listingType, setListingType] = useState("");    // "" | for-sale | for-rent
  const [propertyType, setPropertyType] = useState("");   // "" | family-house | condo | ...
  const [status, setStatus] = useState("");
  const [deliveryYear, setDeliveryYear] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [unitType, setUnitType] = useState("");
  const [bedroomsMin, setBedroomsMin] = useState("");
  const [bathroomsMin, setBathroomsMin] = useState("");
  const [garageCount, setGarageCount] = useState("");
  const [parkingOutside, setParkingOutside] = useState("");
  const [storageUnit, setStorageUnit] = useState(false);
  const [pool, setPool] = useState(false);
  const [elevator, setElevator] = useState(false);
  const [adaptedMobility, setAdaptedMobility] = useState(false);
  const [waterfront, setWaterfront] = useState(false);
  const [waterAccess, setWaterAccess] = useState(false);
  const [navigableWater, setNavigableWater] = useState(false);
  const [resort, setResort] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [livingAreaMin, setLivingAreaMin] = useState("");
  const [livingAreaMax, setLivingAreaMax] = useState("");
  const [constructionYearMin, setConstructionYearMin] = useState("");
  const [constructionYearMax, setConstructionYearMax] = useState("");
  const [newConstruction, setNewConstruction] = useState(false);
  const [centuryHistoric, setCenturyHistoric] = useState(false);
  const [bungalow, setBungalow] = useState(false);
  const [multiStorey, setMultiStorey] = useState(false);
  const [splitLevel, setSplitLevel] = useState(false);
  const [detached, setDetached] = useState(false);
  const [semiDetached, setSemiDetached] = useState(false);
  const [attached, setAttached] = useState(false);
  const [plexType, setPlexType] = useState("");
  const [landAreaMin, setLandAreaMin] = useState("");
  const [landAreaMax, setLandAreaMax] = useState("");
  const [newSince, setNewSince] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [openHouses, setOpenHouses] = useState(false);
  const [repossession, setRepossession] = useState(false);
  const [pedestrianFriendly, setPedestrianFriendly] = useState(false);
  const [transitFriendly, setTransitFriendly] = useState(false);
  const [carFriendly, setCarFriendly] = useState(false);
  const [groceryNearby, setGroceryNearby] = useState(false);
  const [primarySchoolsNearby, setPrimarySchoolsNearby] = useState(false);
  const [secondarySchoolsNearby, setSecondarySchoolsNearby] = useState(false);
  const [daycaresNearby, setDaycaresNearby] = useState(false);
  const [restaurantsNearby, setRestaurantsNearby] = useState(false);
  const [cafesNearby, setCafesNearby] = useState(false);
  const [nightlifeNearby, setNightlifeNearby] = useState(false);
  const [shoppingNearby, setShoppingNearby] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [vibrant, setVibrant] = useState(false);
  const [sort, setSort] = useState<"newest" | "priceAsc" | "priceDesc">("newest");
  const [viewMode, setViewMode] = useState<"galerie" | "carte" | "sommaire">("galerie");
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [savedSearches, setSavedSearches] = useState<{ id: string; name: string; params: Record<string, unknown>; createdAt: string }[]>([]);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [savingSearch, setSavingSearch] = useState(false);
  const [filterLang, setFilterLang] = useState<ProjectsFilterLang>("en");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROJECTS_FILTER_LANG_STORAGE_KEY);
      if (raw === "fr" || raw === "en") setFilterLang(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const setFilterLangPersist = useCallback((lang: ProjectsFilterLang) => {
    setFilterLang(lang);
    try {
      localStorage.setItem(PROJECTS_FILTER_LANG_STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useMemo(() => getProjectsPageCopy(filterLang), [filterLang]);

  const priceSummaryLine = useMemo(() => {
    if (!priceMin && !priceMax) return t.anyPrice;
    if (priceMin && !priceMax) return t.fromPrice.replace("{p}", formatPriceLabel(Number(priceMin)));
    if (!priceMin && priceMax) return t.upToPrice.replace("{p}", formatPriceLabel(Number(priceMax)));
    return t.rangePrice
      .replace("{a}", formatPriceLabel(Number(priceMin)))
      .replace("{b}", formatPriceLabel(Number(priceMax)));
  }, [t, priceMin, priceMax]);

  const statusLabel = useCallback(
    (slug: string) => {
      const opt = t.statusOptions.find((o) => o.value === slug);
      return opt?.label ?? slug.replace(/-/g, " ");
    },
    [t]
  );

  const getCurrentSearchParams = useCallback(() => ({
    searchQuery,
    city,
    category,
    listingType,
    propertyType,
    status,
    deliveryYear,
    priceMin,
    priceMax,
    featuredOnly,
    unitType,
    bedroomsMin,
    bathroomsMin,
    garageCount,
    parkingOutside,
    storageUnit,
    pool,
    elevator,
    adaptedMobility,
    waterfront,
    waterAccess,
    navigableWater,
    resort,
    petsAllowed,
    smokingAllowed,
    livingAreaMin,
    livingAreaMax,
    constructionYearMin,
    constructionYearMax,
    newConstruction,
    centuryHistoric,
    bungalow,
    multiStorey,
    splitLevel,
    detached,
    semiDetached,
    attached,
    plexType,
    landAreaMin,
    landAreaMax,
    newSince,
    moveInDate,
    openHouses,
    repossession,
    pedestrianFriendly,
    transitFriendly,
    carFriendly,
    groceryNearby,
    primarySchoolsNearby,
    secondarySchoolsNearby,
    daycaresNearby,
    restaurantsNearby,
    cafesNearby,
    nightlifeNearby,
    shoppingNearby,
    quiet,
    vibrant,
    sort,
  }), [searchQuery, city, category, listingType, propertyType, status, deliveryYear, priceMin, priceMax, featuredOnly, unitType, bedroomsMin, bathroomsMin, garageCount, parkingOutside, storageUnit, pool, elevator, adaptedMobility, waterfront, waterAccess, navigableWater, resort, petsAllowed, smokingAllowed, livingAreaMin, livingAreaMax, constructionYearMin, constructionYearMax, newConstruction, centuryHistoric, bungalow, multiStorey, splitLevel, detached, semiDetached, attached, plexType, landAreaMin, landAreaMax, newSince, moveInDate, openHouses, repossession, pedestrianFriendly, transitFriendly, carFriendly, groceryNearby, primarySchoolsNearby, secondarySchoolsNearby, daycaresNearby, restaurantsNearby, cafesNearby, nightlifeNearby, shoppingNearby, quiet, vibrant, sort]);

  const applySearchParams = useCallback((p: Record<string, unknown>) => {
    const set = (v: unknown) => (v !== undefined && v !== null ? String(v) : "");
    const setBool = (v: unknown) => v === true || v === "true";
    setSearchQuery(set(p.searchQuery));
    setCity(set(p.city));
    setCategory(set(p.category));
    setListingType(set(p.listingType));
    setPropertyType(set(p.propertyType));
    setStatus(set(p.status));
    setDeliveryYear(set(p.deliveryYear));
    setPriceMin(set(p.priceMin));
    setPriceMax(set(p.priceMax));
    setFeaturedOnly(setBool(p.featuredOnly));
    setUnitType(set(p.unitType));
    setBedroomsMin(set(p.bedroomsMin));
    setBathroomsMin(set(p.bathroomsMin));
    setGarageCount(set(p.garageCount));
    setParkingOutside(set(p.parkingOutside));
    setStorageUnit(setBool(p.storageUnit));
    setPool(setBool(p.pool));
    setElevator(setBool(p.elevator));
    setAdaptedMobility(setBool(p.adaptedMobility));
    setWaterfront(setBool(p.waterfront));
    setWaterAccess(setBool(p.waterAccess));
    setNavigableWater(setBool(p.navigableWater));
    setResort(setBool(p.resort));
    setPetsAllowed(setBool(p.petsAllowed));
    setSmokingAllowed(setBool(p.smokingAllowed));
    setLivingAreaMin(set(p.livingAreaMin));
    setLivingAreaMax(set(p.livingAreaMax));
    setConstructionYearMin(set(p.constructionYearMin));
    setConstructionYearMax(set(p.constructionYearMax));
    setNewConstruction(setBool(p.newConstruction));
    setCenturyHistoric(setBool(p.centuryHistoric));
    setBungalow(setBool(p.bungalow));
    setMultiStorey(setBool(p.multiStorey));
    setSplitLevel(setBool(p.splitLevel));
    setDetached(setBool(p.detached));
    setSemiDetached(setBool(p.semiDetached));
    setAttached(setBool(p.attached));
    setPlexType(set(p.plexType));
    setLandAreaMin(set(p.landAreaMin));
    setLandAreaMax(set(p.landAreaMax));
    setNewSince(set(p.newSince));
    setMoveInDate(set(p.moveInDate));
    setOpenHouses(setBool(p.openHouses));
    setRepossession(setBool(p.repossession));
    setPedestrianFriendly(setBool(p.pedestrianFriendly));
    setTransitFriendly(setBool(p.transitFriendly));
    setCarFriendly(setBool(p.carFriendly));
    setGroceryNearby(setBool(p.groceryNearby));
    setPrimarySchoolsNearby(setBool(p.primarySchoolsNearby));
    setSecondarySchoolsNearby(setBool(p.secondarySchoolsNearby));
    setDaycaresNearby(setBool(p.daycaresNearby));
    setRestaurantsNearby(setBool(p.restaurantsNearby));
    setCafesNearby(setBool(p.cafesNearby));
    setNightlifeNearby(setBool(p.nightlifeNearby));
    setShoppingNearby(setBool(p.shoppingNearby));
    setQuiet(setBool(p.quiet));
    setVibrant(setBool(p.vibrant));
    if (p.sort === "priceAsc" || p.sort === "priceDesc" || p.sort === "newest") setSort(p.sort);
  }, []);

  // On mount, apply URL search params (e.g. from home page Quick Property Search).
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const q = searchParams.get("q");
    const city = searchParams.get("city");
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");
    const category = searchParams.get("category");
    const listingType = searchParams.get("listingType");
    const filter = searchParams.get("filter")?.trim();
    if (!q && !city && !priceMin && !priceMax && !category && !listingType && !filter) return;

    const p: Record<string, unknown> = {};
    if (q != null) p.searchQuery = q;
    if (city != null) p.city = city;
    if (priceMin != null) p.priceMin = priceMin;
    if (priceMax != null) p.priceMax = priceMax;
    if (category != null) p.category = category;
    if (listingType != null) p.listingType = listingType;
    if (filter === "residential" || filter === "commercial") p.category = filter;
    if (filter === "for-rent") p.listingType = "for-rent";
    applySearchParams(p);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount when URL has params
  }, []);

  useEffect(() => {
    fetch("/api/projects/saved-searches", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setSavedSearches(Array.isArray(data) ? data : []))
      .catch(() => setSavedSearches([]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    if (listingType) params.set("listingType", listingType);
    if (propertyType) params.set("propertyType", propertyType);
    if (status) params.set("status", status);
    if (deliveryYear) params.set("deliveryYear", deliveryYear);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (featuredOnly) params.set("featuredOnly", "true");
    if (unitType) params.set("unitType", unitType);
    if (bedroomsMin) params.set("bedroomsMin", bedroomsMin);
    if (bathroomsMin) params.set("bathroomsMin", bathroomsMin);
    if (garageCount) params.set("garageCount", garageCount);
    if (parkingOutside) params.set("parkingOutside", parkingOutside);
    if (storageUnit) params.set("storageUnit", "true");
    if (pool) params.set("pool", "true");
    if (elevator) params.set("elevator", "true");
    if (adaptedMobility) params.set("adaptedMobility", "true");
    if (waterfront) params.set("waterfront", "true");
    if (waterAccess) params.set("waterAccess", "true");
    if (navigableWater) params.set("navigableWater", "true");
    if (resort) params.set("resort", "true");
    if (petsAllowed) params.set("petsAllowed", "true");
    if (smokingAllowed) params.set("smokingAllowed", "true");
    if (livingAreaMin) params.set("livingAreaMin", livingAreaMin);
    if (livingAreaMax) params.set("livingAreaMax", livingAreaMax);
    if (constructionYearMin) params.set("constructionYearMin", constructionYearMin);
    if (constructionYearMax) params.set("constructionYearMax", constructionYearMax);
    if (newConstruction) params.set("newConstruction", "true");
    if (centuryHistoric) params.set("centuryHistoric", "true");
    if (bungalow) params.set("bungalow", "true");
    if (multiStorey) params.set("multiStorey", "true");
    if (splitLevel) params.set("splitLevel", "true");
    if (detached) params.set("detached", "true");
    if (semiDetached) params.set("semiDetached", "true");
    if (attached) params.set("attached", "true");
    if (plexType) params.set("plexType", plexType);
    if (landAreaMin) params.set("landAreaMin", landAreaMin);
    if (landAreaMax) params.set("landAreaMax", landAreaMax);
    if (newSince) params.set("newSince", newSince);
    if (moveInDate) params.set("moveInDate", moveInDate);
    if (openHouses) params.set("openHouses", "true");
    if (repossession) params.set("repossession", "true");
    if (pedestrianFriendly) params.set("pedestrianFriendly", "true");
    if (transitFriendly) params.set("transitFriendly", "true");
    if (carFriendly) params.set("carFriendly", "true");
    if (groceryNearby) params.set("groceryNearby", "true");
    if (primarySchoolsNearby) params.set("primarySchoolsNearby", "true");
    if (secondarySchoolsNearby) params.set("secondarySchoolsNearby", "true");
    if (daycaresNearby) params.set("daycaresNearby", "true");
    if (restaurantsNearby) params.set("restaurantsNearby", "true");
    if (cafesNearby) params.set("cafesNearby", "true");
    if (nightlifeNearby) params.set("nightlifeNearby", "true");
    if (shoppingNearby) params.set("shoppingNearby", "true");
    if (quiet) params.set("quiet", "true");
    if (vibrant) params.set("vibrant", "true");
    if (sort !== "newest") params.set("sort", sort);
    setLoading(true);
    fetch(`/api/projects?${params.toString()}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [searchQuery, city, category, listingType, propertyType, status, deliveryYear, priceMin, priceMax, featuredOnly, unitType, bedroomsMin, bathroomsMin, garageCount, parkingOutside, storageUnit, pool, elevator, adaptedMobility, waterfront, waterAccess, navigableWater, resort, petsAllowed, smokingAllowed, livingAreaMin, livingAreaMax, constructionYearMin, constructionYearMax, newConstruction, centuryHistoric, bungalow, multiStorey, splitLevel, detached, semiDetached, attached, plexType, landAreaMin, landAreaMax, newSince, moveInDate, openHouses, repossession, pedestrianFriendly, transitFriendly, carFriendly, groceryNearby, primarySchoolsNearby, secondarySchoolsNearby, daycaresNearby, restaurantsNearby, cafesNearby, nightlifeNearby, shoppingNearby, quiet, vibrant, sort]);

  useEffect(() => {
    fetch("/api/projects/favorites", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setFavoriteIds(
          new Set(
            list
              .map((f: { projectId?: string }) => f.projectId)
              .filter((projectId): projectId is string => typeof projectId === "string" && projectId.length > 0)
          )
        );
      })
      .catch(() => {});
  }, []);

  const toggleFavorite = useCallback(async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const isFav = favoriteIds.has(projectId);
    const next = new Set(favoriteIds);
    if (isFav) next.delete(projectId);
    else next.add(projectId);
    setFavoriteIds(next);
    try {
      if (isFav) {
        await fetch(`/api/projects/favorites?projectId=${encodeURIComponent(projectId)}`, { method: "DELETE", credentials: "same-origin" });
      } else {
        await fetch("/api/projects/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId }), credentials: "same-origin" });
      }
    } catch {
      setFavoriteIds(favoriteIds);
    }
  }, [favoriteIds]);

  const formatYear = (d: string) => (d ? new Date(d).getFullYear() : "—");
  const heroUrl = (p: Project) =>
    p.heroImage || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800";

  return (
    <main className="min-h-screen bg-[#0a0e17] text-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              New Developments
            </h1>
            <p className="mt-2 text-slate-400">
              Premium projects in Montreal and Laval. Find your next investment or home.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="mr-2 text-xs font-medium uppercase tracking-wider text-slate-500">{t.presentation}:</span>
            <button
              type="button"
              onClick={() => setViewMode("galerie")}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                viewMode === "galerie"
                  ? "bg-teal-500 text-slate-950"
                  : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {t.gallery}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("carte")}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                viewMode === "carte"
                  ? "bg-teal-500 text-slate-950"
                  : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {t.map}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("sommaire")}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                viewMode === "sommaire"
                  ? "bg-teal-500 text-slate-950"
                  : "border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {t.summary}
            </button>
            <Link
              href="/"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-teal-400 transition-colors hover:bg-white/10"
            >
              {t.home}
            </Link>
            <span className="flex items-center text-sm text-slate-400">
              <PhoneCallUs showLabel={true} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5" />
            </span>
          </div>
        </div>

        {/* Filters — Centris-style: Research > Filters with 7 groups */}
        <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] shadow-xl">
          <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">{t.filtersTitle}</h2>
              <p className="mt-0.5 text-sm text-slate-400">{t.filtersSubtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">{t.filterLanguageHint}</span>
              <div className="inline-flex rounded-lg border border-white/15 bg-white/5 p-0.5">
                <button
                  type="button"
                  onClick={() => setFilterLangPersist("en")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    filterLang === "en" ? "bg-teal-500 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t.filterLanguageEn}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterLangPersist("fr")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    filterLang === "fr" ? "bg-teal-500 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t.filterLanguageFr}
                </button>
              </div>
            </div>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* 1. Category — Residential / Commercial & For sale / For rent */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{t.s1Category}</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">{t.residentialCommercial}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                  >
                    <option value="">{t.all}</option>
                    <option value="residential">{t.residential}</option>
                    <option value="commercial">{t.commercial}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">{t.forSaleRent}</label>
                  <select
                    value={listingType}
                    onChange={(e) => setListingType(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                  >
                    <option value="">{t.all}</option>
                    <option value="for-sale">{t.forSale}</option>
                    <option value="for-rent">{t.forRent}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Price — line from $0 to $20M (Centris-style) */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{t.s2Price}</h3>
              <p className="mb-2 text-[11px] text-slate-500">{priceSummaryLine}</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">{t.min}</label>
                  <input
                    type="range"
                    min={PRICE_RANGE_MIN}
                    max={priceMax ? Number(priceMax) : PRICE_RANGE_MAX}
                    step={PRICE_STEP}
                    value={priceMin ? Number(priceMin) : PRICE_RANGE_MIN}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setPriceMin(v === PRICE_RANGE_MIN ? "" : String(v));
                      if (priceMax && v > Number(priceMax)) setPriceMax(String(v));
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-teal-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span className="mt-0.5 block text-right text-xs text-slate-500">
                    {formatPriceLabel(priceMin ? Number(priceMin) : PRICE_RANGE_MIN)}
                  </span>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">{t.max}</label>
                  <input
                    type="range"
                    min={Math.max(PRICE_RANGE_MIN, priceMin ? Number(priceMin) : 0)}
                    max={PRICE_RANGE_MAX}
                    step={PRICE_STEP}
                    value={priceMax ? Number(priceMax) : PRICE_RANGE_MAX}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setPriceMax(v === PRICE_RANGE_MAX ? "" : String(v));
                      if (priceMin && v < Number(priceMin)) setPriceMin(String(v));
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-teal-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <span className="mt-0.5 block text-right text-xs text-slate-500">
                    {formatPriceLabel(priceMax ? Number(priceMax) : PRICE_RANGE_MAX)}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">{t.priceRangeHint}</p>
            </div>

            {/* 3. Type of property */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{t.s3Type}</h3>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
              >
                {t.propertyTypeOptions.map((p) => (
                  <option key={p.value || "all"} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-slate-500">{t.propertyTypeHint}</p>
            </div>

            {/* 4. Characteristics (Caractéristiques) */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-2">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{t.s4Characteristics}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-500">{t.bedrooms}</label>
                    <select
                      value={bedroomsMin}
                      onChange={(e) => setBedroomsMin(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    >
                      {t.roomsOptions.map((r) => (
                        <option key={r.value || "any"} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-500">{t.bathrooms}</label>
                    <select
                      value={bathroomsMin}
                      onChange={(e) => setBathroomsMin(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    >
                      {t.bathroomsOptions.map((b) => (
                        <option key={b.value || "any"} value={b.value}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-500">{t.insideGarage}</label>
                    <select
                      value={garageCount}
                      onChange={(e) => setGarageCount(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    >
                      {t.garageParkingOptions.map((g) => (
                        <option key={g.value || "any"} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-500">{t.outsideParking}</label>
                    <select
                      value={parkingOutside}
                      onChange={(e) => setParkingOutside(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    >
                      {t.garageParkingOptions.map((g) => (
                        <option key={g.value || "any"} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={storageUnit} onChange={(e) => setStorageUnit(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.storageUnit}
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={pool} onChange={(e) => setPool(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.pool}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={elevator} onChange={(e) => setElevator(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.elevator}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={adaptedMobility} onChange={(e) => setAdaptedMobility(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.adaptedMobility}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={waterfront} onChange={(e) => setWaterfront(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.waterfront}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={waterAccess} onChange={(e) => setWaterAccess(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.waterAccess}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={navigableWater} onChange={(e) => setNavigableWater(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.navigableWater}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={resort} onChange={(e) => setResort(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.resort}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={petsAllowed} onChange={(e) => setPetsAllowed(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.petsAllowed}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={smokingAllowed} onChange={(e) => setSmokingAllowed(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.smokingAllowed}
                  </label>
                </div>
              </div>
              {/* Centris-style: “En vedette” row — blue checkbox, teal-highlighted unit type (matches portal filters) */}
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="rounded-xl border border-white/[0.08] bg-[#1e1e21] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-6">
                    <label className="flex cursor-pointer select-none items-center gap-3 sm:min-h-[42px]">
                      <input
                        type="checkbox"
                        checked={featuredOnly}
                        onChange={(e) => setFeaturedOnly(e.target.checked)}
                        className="size-[18px] shrink-0 cursor-pointer rounded border-2 border-blue-500/70 bg-[#121214] text-blue-600 accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/35"
                      />
                      <span className="text-sm leading-tight text-white">
                        <span className="font-medium">{t.featuredOnly}</span>
                      </span>
                    </label>
                    <div className="min-w-[200px] max-w-sm flex-1 sm:ml-auto">
                      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        {t.unitType}
                      </label>
                      <select
                        value={unitType}
                        onChange={(e) => setUnitType(e.target.value)}
                        className="w-full rounded-lg border-2 border-cyan-500/55 bg-[#121214] px-3 py-2.5 text-sm text-white shadow-[0_0_0_1px_rgba(34,211,238,0.12)] outline-none transition-colors hover:border-cyan-400/70 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25"
                      >
                        {t.unitTypeOptions.map((u) => (
                          <option key={u.value || "any"} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Building */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-2">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{t.s5Building}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-500">{t.livingArea}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder={t.minShort}
                        min={0}
                        value={livingAreaMin}
                        onChange={(e) => setLivingAreaMin(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                      />
                      <span className="text-slate-500">{t.to}</span>
                      <input
                        type="number"
                        placeholder={t.maxShort}
                        min={0}
                        value={livingAreaMax}
                        onChange={(e) => setLivingAreaMax(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-500">{t.constructionYear}</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={constructionYearMin}
                        onChange={(e) => setConstructionYearMin(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                      >
                        <option value="">{t.minShort}</option>
                        {CONSTRUCTION_YEARS.map((y) => (
                          <option key={y} value={String(y)}>{y}</option>
                        ))}
                      </select>
                      <span className="text-slate-500">{t.to}</span>
                      <select
                        value={constructionYearMax}
                        onChange={(e) => setConstructionYearMax(e.target.value)}
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                      >
                        <option value="">{t.maxShort}</option>
                        {CONSTRUCTION_YEARS.map((y) => (
                          <option key={y} value={String(y)}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-500">{t.deliveryYear}</label>
                    <select
                      value={deliveryYear}
                      onChange={(e) => setDeliveryYear(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    >
                      <option value="">{t.anyYear}</option>
                      {YEARS.map((y) => (
                        <option key={y} value={String(y)}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-500">{t.projectStatus}</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    >
                      {t.statusOptions.map((s) => (
                        <option key={s.value || "all"} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="mb-2 text-[11px] font-medium text-slate-500">{t.buildingType}</p>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={newConstruction} onChange={(e) => setNewConstruction(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.newConstruction}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={centuryHistoric} onChange={(e) => setCenturyHistoric(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.centuryHistoric}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={bungalow} onChange={(e) => setBungalow(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.bungalow}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={multiStorey} onChange={(e) => setMultiStorey(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.multiStorey}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={splitLevel} onChange={(e) => setSplitLevel(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.splitLevel}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={detached} onChange={(e) => setDetached(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.detached}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={semiDetached} onChange={(e) => setSemiDetached(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.semiDetached}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={attached} onChange={(e) => setAttached(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.attached}
                  </label>
                </div>
              </div>
            </div>

            {/* 6. Plex */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{t.s6Plex}</h3>
              <select
                value={plexType}
                onChange={(e) => setPlexType(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
              >
                {t.plexOptions.map((p) => (
                  <option key={p.value || "any"} value={p.value}>{p.label}</option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-slate-500">{t.plexHint}</p>
            </div>

            {/* 7. Style de vie (Lifestyle) */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-2">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{t.s7Lifestyle}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{t.transport}</p>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={pedestrianFriendly} onChange={(e) => setPedestrianFriendly(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.pedestrianFriendly}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={transitFriendly} onChange={(e) => setTransitFriendly(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.transitFriendly}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={carFriendly} onChange={(e) => setCarFriendly(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.carFriendly}
                  </label>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{t.nearbyServices}</p>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={groceryNearby} onChange={(e) => setGroceryNearby(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.grocery}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={primarySchoolsNearby} onChange={(e) => setPrimarySchoolsNearby(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.primarySchools}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={secondarySchoolsNearby} onChange={(e) => setSecondarySchoolsNearby(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.secondarySchools}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={daycaresNearby} onChange={(e) => setDaycaresNearby(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.daycares}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={restaurantsNearby} onChange={(e) => setRestaurantsNearby(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.restaurants}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={cafesNearby} onChange={(e) => setCafesNearby(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.cafes}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={nightlifeNearby} onChange={(e) => setNightlifeNearby(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.nightlife}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={shoppingNearby} onChange={(e) => setShoppingNearby(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.shopping}
                  </label>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{t.character}</p>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={quiet} onChange={(e) => setQuiet(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.quiet}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={vibrant} onChange={(e) => setVibrant(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.vibrant}
                  </label>
                </div>
              </div>
            </div>

            {/* 8. Other criteria (Autres critères) */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-2">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{t.s8Other}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">{t.keyword}</label>
                  <input
                    type="text"
                    placeholder={t.keywordPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">{t.city}</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                  >
                    {t.cityOptions.map((c) => (
                      <option key={c.value || "all"} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">{t.landArea}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={t.minShort}
                      min={0}
                      value={landAreaMin}
                      onChange={(e) => setLandAreaMin(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    />
                    <span className="text-slate-500">{t.to}</span>
                    <input
                      type="number"
                      placeholder={t.maxShort}
                      min={0}
                      value={landAreaMax}
                      onChange={(e) => setLandAreaMax(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">{t.newSince}</label>
                  <input
                    type="date"
                    value={newSince}
                    onChange={(e) => setNewSince(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500">{t.pickDate}</p>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-500">{t.moveInDate}</label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                  />
                  <p className="mt-0.5 text-[10px] text-slate-500">{t.pickDate}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={openHouses} onChange={(e) => setOpenHouses(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.openHouses}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input type="checkbox" checked={repossession} onChange={(e) => setRepossession(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500/50" />
                    {t.repossession}
                  </label>
                </div>
              </div>
            </div>
          </div>
          {/* Result count, Sort, Reset — like Centris */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-4">
            <span className="text-sm font-medium text-slate-200">
              {loading ? t.resultsLoading : (
                <>
                  <span className="text-teal-400">{projects.length}</span>
                  {" "}
                  {t.resultsCount
                    .replace("{n}", String(projects.length))
                    .replace("{unit}", projects.length === 1 ? t.property : t.properties)}
                </>
              )}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <span>{t.sortBy}</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "newest" | "priceAsc" | "priceDesc")}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                >
                  <option value="newest">{t.sortNewest}</option>
                  <option value="priceAsc">{t.sortPriceAsc}</option>
                  <option value="priceDesc">{t.sortPriceDesc}</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCity("");
                  setCategory("");
                  setListingType("");
                  setPropertyType("");
                  setStatus("");
                  setDeliveryYear("");
                  setPriceMin("");
                  setPriceMax("");
                  setFeaturedOnly(false);
                  setUnitType("");
                  setBedroomsMin("");
                  setBathroomsMin("");
                  setGarageCount("");
                  setParkingOutside("");
                  setStorageUnit(false);
                  setPool(false);
                  setElevator(false);
                  setAdaptedMobility(false);
                  setWaterfront(false);
                  setWaterAccess(false);
                  setNavigableWater(false);
                  setResort(false);
                  setPetsAllowed(false);
                  setSmokingAllowed(false);
                  setLivingAreaMin("");
                  setLivingAreaMax("");
                  setConstructionYearMin("");
                  setConstructionYearMax("");
                  setNewConstruction(false);
                  setCenturyHistoric(false);
                  setBungalow(false);
                  setMultiStorey(false);
                  setSplitLevel(false);
                  setDetached(false);
                  setSemiDetached(false);
                  setAttached(false);
                  setPlexType("");
                  setLandAreaMin("");
                  setLandAreaMax("");
                  setNewSince("");
                  setMoveInDate("");
                  setOpenHouses(false);
                  setRepossession(false);
                  setPedestrianFriendly(false);
                  setTransitFriendly(false);
                  setCarFriendly(false);
                  setGroceryNearby(false);
                  setPrimarySchoolsNearby(false);
                  setSecondarySchoolsNearby(false);
                  setDaycaresNearby(false);
                  setRestaurantsNearby(false);
                  setCafesNearby(false);
                  setNightlifeNearby(false);
                  setShoppingNearby(false);
                  setQuiet(false);
                  setVibrant(false);
                  setSort("newest");
                }}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {t.resetFilters}
              </button>
            </div>
          </div>
        </div>

        {/* Research bar: show clients how many properties are available after filters */}
        {!loading && (
          <div className="mb-6 rounded-xl border border-teal-500/30 bg-teal-500/10 px-6 py-4">
            <p className="text-center text-lg font-semibold text-slate-100">
              {projects.length === 0 ? (
                t.noMatchBanner
              ) : (
                <>
                  <span className="text-teal-400">{projects.length}</span>
                  {" "}
                  {t.resultsCount
                    .replace("{n}", String(projects.length))
                    .replace("{unit}", projects.length === 1 ? t.property : t.properties)}
                </>
              )}
            </p>
            <p className="mt-1 text-center text-sm text-slate-400">
              {projects.length > 0 && t.resultsBanner}
            </p>
          </div>
        )}

        {/* Save search / Saved searches */}
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-300">Save or load a search:</span>
            <input
              type="text"
              placeholder="Search name (e.g. Montreal condos)"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              className="w-56 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            />
            <button
              type="button"
              disabled={savingSearch}
              onClick={async () => {
                setSavingSearch(true);
                try {
                  const res = await fetch("/api/projects/saved-searches", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: saveSearchName.trim() || "My search",
                      params: getCurrentSearchParams(),
                    }),
                    credentials: "same-origin",
                  });
                  const data = await res.json().catch(() => ({}));
                  if (data.id) {
                    setSavedSearches((prev) => [{ id: data.id, name: data.name, params: data.params || {}, createdAt: data.createdAt }, ...prev]);
                    setSaveSearchName("");
                  }
                } finally {
                  setSavingSearch(false);
                }
              }}
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-teal-400 disabled:opacity-50"
            >
              {savingSearch ? t.saving : t.saveSearch}
            </button>
          </div>
          {savedSearches.length > 0 && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{t.savedSearches}</p>
              <ul className="flex flex-wrap gap-2">
                {savedSearches.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-sm text-slate-200">{s.name}</span>
                    <button
                      type="button"
                      onClick={() => applySearchParams(s.params)}
                      className="text-xs font-medium text-teal-400 hover:text-teal-300"
                    >
                      {t.load}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/projects/saved-searches?id=${encodeURIComponent(s.id)}`, { method: "DELETE", credentials: "same-origin" });
                        setSavedSearches((prev) => prev.filter((x) => x.id !== s.id));
                      }}
                      className="text-xs font-medium text-slate-400 hover:text-red-400"
                    >
                      {t.delete}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-400">{t.loadingProjects}</p>
          </div>
        ) : viewMode === "sommaire" ? (
          <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] shadow-xl">
            {projects.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                {t.noProjectsTable}
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-3 font-semibold text-slate-200">{t.tableProject}</th>
                    <th className="px-4 py-3 font-semibold text-slate-200">{t.tableCity}</th>
                    <th className="px-4 py-3 font-semibold text-slate-200">{t.tablePrice}</th>
                    <th className="px-4 py-3 font-semibold text-slate-200">{t.tableStatus}</th>
                    <th className="px-4 py-3 font-semibold text-slate-200">{t.tableDelivery}</th>
                    <th className="px-4 py-3 font-semibold text-slate-200"></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <span className="font-medium text-white">{p.name}</span>
                        {isFeatured(p) && (
                          <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-950" style={{ backgroundColor: FEATURED_GOLD }}>{t.featured}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{p.city}</td>
                      <td className="px-4 py-3 text-teal-400">
                        {t.fromPricePrefix} ${p.startingPrice >= 1000 ? `${(p.startingPrice / 1000).toFixed(0)}k` : p.startingPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-400 capitalize">{statusLabel(p.status)}</td>
                      <td className="px-4 py-3 text-slate-400">{formatYear(p.deliveryDate)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/projects/${p.id}`} className="font-medium text-teal-400 hover:text-teal-300">
                          {t.tableView}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : viewMode === "carte" ? (
          <div className="w-full">
            {HAS_GOOGLE_MAPS_KEY ? (
              <ProjectsGoogleMap
                projects={projects.map((p) => ({
                  id: p.id,
                  name: p.name,
                  city: p.city,
                  startingPrice: p.startingPrice,
                  featured: isFeatured(p),
                  latitude: p.latitude,
                  longitude: p.longitude,
                }))}
              />
            ) : (
              <ProjectsMap
                projects={projects.map((p) => ({
                  id: p.id,
                  name: p.name,
                  city: p.city,
                  startingPrice: p.startingPrice,
                  featured: isFeatured(p),
                  latitude: p.latitude,
                  longitude: p.longitude,
                }))}
              />
            )}
            <p className="mt-4 text-center text-sm text-slate-500">
              {t.mapHint}
            </p>
          </div>
        ) : viewMode === "galerie" && projects.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center shadow-xl">
            <p className="text-slate-400">
              No projects match your filters. Try adjusting criteria or check back later.
            </p>
          </div>
        ) : viewMode === "galerie" ? (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-xl transition-all duration-200 hover:scale-[1.02] hover:border-teal-500/30 hover:shadow-teal-500/10"
              >
                <div className="relative">
                  <div
                    className="aspect-[16/9] w-full bg-cover bg-center transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundImage: `url('${heroUrl(p)}')` }}
                  />
                  {isFeatured(p) && (
                    <span
                      className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-slate-950 shadow-lg"
                      style={{ backgroundColor: FEATURED_GOLD }}
                    >
                      {t.featured}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={favoriteIds.has(p.id) ? "Remove from favorites" : "Add to favorites"}
                    onClick={(e) => toggleFavorite(e, p.id)}
                    className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70"
                  >
                    {favoriteIds.has(p.id) ? (
                      <svg className="h-5 w-5 fill-red-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L12 6.343l3.172-3.171a4 4 0 115.656 5.656L12 17.657l-8.828-8.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    )}
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  {!isFeatured(p) && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                      {statusLabel(p.status)}
                    </span>
                  )}
                  <h2 className={`font-bold text-white transition-colors group-hover:text-teal-300 ${isFeatured(p) ? "mt-2 text-xl" : "mt-2 text-xl"}`}>
                    {p.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {p.city} · {p.developer}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-300">{p.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-6">
                    <span className="font-semibold text-teal-400">
                      {t.fromPricePrefix} ${p.startingPrice >= 1000 ? `${(p.startingPrice / 1000).toFixed(0)}k` : p.startingPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-slate-500">
                      {t.delivery} {formatYear(p.deliveryDate)}
                    </span>
                  </div>
                  <span className="mt-4 inline-block text-sm font-medium text-teal-400 transition-colors group-hover:text-teal-300">
                    {t.viewProject}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
