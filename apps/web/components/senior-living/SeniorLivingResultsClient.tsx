"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { careLevelFriendly, careLevelShortLabel } from "@/modules/senior-living/friendly-copy";
import {
  buildHeatmapGeoJSON,
  getBestZoneLngLat,
} from "@/modules/senior-living/map/senior-heatmap.service";
import {
  buildSeniorMapPins,
  capPins,
  cityCenterFromName,
  maxPinsForMode,
} from "@/modules/senior-living/map/senior-map.service";
import { useSeniorLivingAccessibility } from "./SeniorLivingAccessibilityProvider";
import { SeniorBestMatchCard } from "@/modules/senior-living/ui/senior-best-match-card";
import { readSeniorResultsAb } from "@/modules/senior-living/ui/senior-results-smart";
import { SeniorMapSmartHeading } from "@/modules/senior-living/ui/senior-map-smart";

type ResidenceRow = {
  id: string;
  name: string;
  city: string;
  province: string;
  careLevel: string;
  verified: boolean;
  basePrice: number | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  latitude: number | null;
  longitude: number | null;
};

type MatchRow = {
  residenceId: string;
  score?: number;
  displayScore?: number;
  headline?: string;
  bullets?: string[];
  explanation?: string[];
  reasons?: string[];
};

const SeniorMapPanel = dynamic(
  () =>
    import("@/modules/senior-living/map/senior-map.component").then((m) => ({
      default: m.SeniorMapPanel,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[320px] items-center justify-center rounded-xl border-2 border-neutral-200 bg-neutral-50 text-lg font-semibold text-neutral-600 lg:min-h-[560px]"
        role="status"
      >
        Loading map…
      </div>
    ),
  },
);

function trackMatchEvent(payload: { eventType: string; residenceId: string; scoreAtTime?: number }) {
  void fetch("/api/senior/matching/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export function SeniorLivingResultsClient(props: {
  locale: string;
  country: string;
  initialResidences: ResidenceRow[];
  initialCityFilter: string | null;
  mapboxToken?: string | null;
}) {
  const base = `/${props.locale}/${props.country}`;
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profileId");
  const compareMode = searchParams.get("compare") === "1";
  const abVariant = readSeniorResultsAb(searchParams);
  const { familyHelperMode } = useSeniorLivingAccessibility();

  const mapboxToken = (props.mapboxToken ?? "").trim();

  const [rows] = useState(props.initialResidences);
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [loading, setLoading] = useState(!!profileId);
  const [comparePick, setComparePick] = useState<string[]>([]);

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [highlightedListId, setHighlightedListId] = useState<string | null>(null);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [touchLarge, setTouchLarge] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [heatmapFlyNonce, setHeatmapFlyNonce] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [isLg, setIsLg] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setTouchLarge(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsLg(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const aiRes = await fetch("/api/senior/ai/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId }),
        });
        if (aiRes.ok) {
          const j = (await aiRes.json()) as {
            matches?: Array<{
              residenceId: string;
              displayScore: number;
              headline: string;
              bullets: string[];
            }>;
          };
          if (!cancelled)
            setMatches(
              (j.matches ?? []).map((m) => ({
                residenceId: m.residenceId,
                displayScore: m.displayScore,
                headline: m.headline,
                bullets: m.bullets,
              })),
            );
          return;
        }
        const res = await fetch(`/api/senior/match?profileId=${encodeURIComponent(profileId)}`);
        const j = (await res.json()) as { matches?: MatchRow[] };
        if (!cancelled)
          setMatches(
            (j.matches ?? []).map((m) => ({
              residenceId: m.residenceId,
              score: m.score,
              explanation: m.explanation,
              reasons: m.reasons,
            })),
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const orderedRows = useMemo(() => {
    if (!matches?.length) return rows;
    const order = new Map(matches.map((m, i) => [m.residenceId, i]));
    return [...rows].sort((a, b) => {
      const ia = order.has(a.id) ? (order.get(a.id) ?? 99) : 999;
      const ib = order.has(b.id) ? (order.get(b.id) ?? 99) : 999;
      return ia - ib;
    });
  }, [rows, matches]);

  const visibleRows = useMemo(() => {
    if (!matches?.length) return orderedRows;
    const cap = Math.min(abVariant.maxResults, matches.length);
    const ids = matches.slice(0, cap).map((m) => m.residenceId);
    const rowMap = new Map(orderedRows.map((r) => [r.id, r]));
    return ids.map((id) => rowMap.get(id)).filter(Boolean) as ResidenceRow[];
  }, [orderedRows, matches, abVariant.maxResults]);

  const bestMeta = matches?.[0];
  const bestResidenceRow =
    bestMeta ? orderedRows.find((r) => r.id === bestMeta.residenceId) ?? null : null;

  const priceLabel = useCallback((r: ResidenceRow) => {
    if (r.priceRangeMin != null && r.priceRangeMax != null) {
      return `$${Math.round(r.priceRangeMin)} – $${Math.round(r.priceRangeMax)} per month`;
    }
    if (r.basePrice != null) return `From $${Math.round(r.basePrice)} per month`;
    return "Ask for pricing";
  }, []);

  const mapPins = useMemo(() => {
    const rowsForPins = matches?.length ? visibleRows : orderedRows;
    const built = buildSeniorMapPins(rowsForPins, priceLabel, (id) => `${base}/senior-living/${id}`);
    return capPins(built, nearbyMode);
  }, [orderedRows, visibleRows, matches?.length, priceLabel, base, nearbyMode]);

  const mapPinsTotal = useMemo(() => {
    const rowsForPins = matches?.length ? visibleRows : orderedRows;
    return buildSeniorMapPins(rowsForPins, priceLabel, (id) => `${base}/senior-living/${id}`).length;
  }, [orderedRows, visibleRows, matches?.length, priceLabel, base]);

  const heatInputs = useMemo(() => {
    const rowsForHeat = matches?.length ? visibleRows : orderedRows;
    return rowsForHeat
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => {
        const m = matches?.find((x) => x.residenceId === r.id);
        const raw =
          typeof m?.displayScore === "number" ? m.displayScore
          : typeof m?.score === "number" ? m.score
          : null;
        return {
          id: r.id,
          latitude: r.latitude as number,
          longitude: r.longitude as number,
          matchScore: raw,
        };
      });
  }, [orderedRows, visibleRows, matches]);

  const heatmapGeoJson = useMemo(() => buildHeatmapGeoJSON(heatInputs), [heatInputs]);
  const bestHeatLngLat = useMemo(() => getBestZoneLngLat(heatmapGeoJson), [heatmapGeoJson]);
  const initialCityCenter = useMemo(
    () => cityCenterFromName(props.initialCityFilter),
    [props.initialCityFilter],
  );

  const topThreeDrawer = useMemo(() => {
    const pinIds = new Set(mapPins.map((p) => p.id));
    const pool = matches?.length ? visibleRows : orderedRows;
    return pool.filter((r) => pinIds.has(r.id)).slice(0, 3);
  }, [orderedRows, visibleRows, matches?.length, mapPins]);

  const scrollToResidence = useCallback((id: string) => {
    const el = document.getElementById(`sl-res-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const onPinOpen = useCallback(
    (id: string) => {
      setHighlightedListId(id);
      scrollToResidence(id);
    },
    [scrollToResidence],
  );

  useEffect(() => {
    if (profileId && loading) return;
    const pool = matches?.length ? visibleRows : orderedRows;
    if (pool.length === 0) return;
    const signature = `${profileId ?? "browse"}|${pool
      .map((x) => x.id)
      .sort()
      .join(",")}`;
    let key = "";
    try {
      key = `sl_res_views_${signature.slice(0, 180)}`;
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
    } catch {
      return;
    }
    const events = pool.slice(0, 60).map((r) => {
      const m = matches?.find((x) => x.residenceId === r.id);
      return {
        eventType: "VIEW" as const,
        residenceId: r.id,
        scoreAtTime: typeof m?.displayScore === "number" ? m.displayScore : m?.score,
      };
    });
    void fetch("/api/senior/matching/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    }).catch(() => {});
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
  }, [orderedRows, visibleRows, matches, loading, profileId]);

  function toggleCompare(id: string) {
    setComparePick((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  function toggleHeatmap() {
    setHeatmapEnabled((prev) => {
      const next = !prev;
      if (next) setHeatmapFlyNonce((n) => n + 1);
      return next;
    });
  }

  const mapConfigured = mapboxToken.length > 0;
  const mapHasPins = mapPins.length > 0;
  const showDesktopSplit = viewMode === "map" && mapConfigured && mapHasPins && isLg;
  const showMobileMapLayout = viewMode === "map" && mapConfigured && mapHasPins && !isLg;
  const hideStandardListGrid = showDesktopSplit || showMobileMapLayout;

  const filterBar = (
    <div className="mt-6 rounded-2xl border-2 border-neutral-200 bg-neutral-50 px-4 py-4 text-base">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Filters</p>
          <p className="mt-1 font-semibold text-neutral-900">
            {props.initialCityFilter ?
              <>Area: {props.initialCityFilter}</>
            : <>All areas shown</>}
            <span className="mx-2 text-neutral-400" aria-hidden>
              ·
            </span>
            <span className="text-neutral-700">{visibleRows.length} places</span>
          </p>
        </div>
        <Link
          href={`${base}/senior-living/guide`}
          className="inline-flex min-h-[44px] items-center font-bold text-teal-800 underline decoration-2 underline-offset-4"
        >
          Change preferences
        </Link>
      </div>
    </div>
  );

  const mapControls = (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-neutral-200 bg-white px-4 py-4 shadow-sm">
      {profileId ? <SeniorMapSmartHeading /> : null}
      <label className="flex cursor-pointer items-center gap-3 text-lg font-semibold text-neutral-900">
        <input
          type="checkbox"
          className="h-7 w-7 shrink-0 rounded border-2 border-neutral-800 accent-amber-600"
          checked={nearbyMode}
          onChange={(e) => setNearbyMode(e.target.checked)}
        />
        Show more nearby pins (up to {maxPinsForMode(true)})
      </label>
      <button
        type="button"
        aria-pressed={heatmapEnabled}
        className={`min-h-[52px] rounded-xl border-2 px-5 text-left text-lg font-bold transition-colors ${
          heatmapEnabled ?
            "border-amber-700 bg-amber-50 text-neutral-900"
          : "border-neutral-800 bg-neutral-50 text-neutral-900 hover:bg-neutral-100"
        }`}
        onClick={toggleHeatmap}
      >
        Show Best Areas
        <span className="mt-1 block text-sm font-semibold text-neutral-600">
          {heatmapEnabled ? "On — warmer colors mean stronger fit for these results." : "Off — map shows pins only."}
        </span>
      </button>
      <p className="text-sm font-medium text-neutral-600">
        Showing up to {maxPinsForMode(nearbyMode)} pins on the map
        {mapPinsTotal > mapPins.length ?
          ` (${mapPinsTotal} have coordinates)`
        : mapPinsTotal > 0 ?
          ` (${mapPinsTotal} with coordinates)`
        : ""}
        .
      </p>
    </div>
  );

  const residenceCards = visibleRows.map((r) => {
    const m = matches?.find((x) => x.residenceId === r.id);
    const isHi = highlightedListId === r.id;
    const reasonLines = m?.bullets?.length ? m.bullets : m?.reasons ?? m?.explanation;
    return (
      <li
        key={r.id}
        id={`sl-res-${r.id}`}
        tabIndex={0}
        className={`sl-card flex flex-col outline-none transition-shadow ${
          isHi ? "ring-4 ring-amber-400 ring-offset-2" : ""
        }`}
        onFocus={() => setHighlightedListId(r.id)}
        onClick={() => setHighlightedListId(r.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setHighlightedListId(r.id);
          }
        }}
      >
        <div
          className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg bg-neutral-200 text-center text-neutral-600"
          aria-hidden
        >
          <span className="px-4 text-base font-semibold">Photo coming soon</span>
        </div>
        <div className="mt-4 flex flex-1 flex-col">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-xl font-bold leading-tight">{r.name}</h2>
            {r.verified ?
              <span className="shrink-0 rounded border-2 border-teal-800 bg-teal-50 px-3 py-1 text-sm font-bold text-teal-900">
                Verified
              </span>
            : null}
          </div>
          <p className="mt-2 font-semibold text-neutral-900">
            {r.city}, {r.province}
          </p>
          <p className="mt-3 text-lg font-bold text-neutral-900">{priceLabel(r)}</p>
          <p className="mt-2 font-semibold text-neutral-900">{careLevelShortLabel(r.careLevel)}</p>
          <p className="mt-2 text-base leading-relaxed sl-text-muted">{careLevelFriendly(r.careLevel)}</p>
          {reasonLines?.length ?
            <ul className="mt-3 space-y-1 text-base font-semibold text-teal-900">
              {reasonLines.slice(0, 4).map((line) => (
                <li key={`${r.id}-${line.slice(0, 40)}`}>{line}</li>
              ))}
            </ul>
          : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`${base}/senior-living/${r.id}`}
              className="sl-btn-secondary sl-btn-block-mobile inline-flex min-h-[52px] flex-1 items-center justify-center text-center no-underline"
              onClick={(e) => {
                e.stopPropagation();
                trackMatchEvent({
                  eventType: "CLICK",
                  residenceId: r.id,
                  scoreAtTime: typeof m?.displayScore === "number" ? m.displayScore : m?.score,
                });
              }}
              onKeyDown={(e) => e.stopPropagation()}
              onFocus={() => setHighlightedListId(r.id)}
            >
              View details
            </Link>
            <Link
              href={`${base}/senior-living/${r.id}#visit`}
              className="sl-btn-primary sl-btn-block-mobile inline-flex min-h-[52px] flex-1 items-center justify-center text-center no-underline"
              onClick={(e) => {
                e.stopPropagation();
                trackMatchEvent({
                  eventType: "CLICK",
                  residenceId: r.id,
                  scoreAtTime: typeof m?.displayScore === "number" ? m.displayScore : m?.score,
                });
              }}
              onKeyDown={(e) => e.stopPropagation()}
              onFocus={() => setHighlightedListId(r.id)}
            >
              {abVariant.ctaLabel}
            </Link>
          </div>

          {compareMode ?
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCompare(r.id);
              }}
              aria-pressed={comparePick.includes(r.id)}
              className="sl-btn-secondary mt-4 min-h-[48px] w-full"
            >
              {comparePick.includes(r.id) ? "Remove from compare" : "Add to compare"}
            </button>
          : null}
        </div>
      </li>
    );
  });

  const mapPanelEl =
    mapConfigured && mapHasPins ?
      <SeniorMapPanel
        mapboxToken={mapboxToken}
        pins={mapPins}
        highlightedListId={highlightedListId}
        onPinOpen={onPinOpen}
        fullScreen={mapFullscreen}
        onExitFullscreen={() => setMapFullscreen(false)}
        largeTouchTargets={touchLarge}
        heatmapEnabled={heatmapEnabled}
        heatmapGeoJson={heatmapGeoJson}
        bestHeatLngLat={bestHeatLngLat}
        heatmapFlyNonce={heatmapFlyNonce}
        initialCityCenter={initialCityCenter}
      />
    : null;

  return (
    <div
      className={`px-4 py-8 ${showMobileMapLayout ? "pb-[min(360px,52vh)]" : "pb-28"}`}
    >
      <div className={showDesktopSplit ? "mx-auto max-w-7xl" : "mx-auto max-w-5xl"}>
        <Link href={`${base}/senior-living`} className="font-semibold text-teal-800 underline">
          ← Back to home
        </Link>

        <h1 className="mt-8 text-3xl font-bold tracking-tight text-neutral-900">Places that may fit</h1>
        <p className="mt-4 max-w-2xl text-lg sl-text-muted">
          {profileId ?
            "These ideas are based on what you told us. Always visit in person and ask your own questions."
          : props.initialCityFilter ?
            `Showing places in or near ${props.initialCityFilter}.`
          : "Showing places in our directory."}
          {familyHelperMode ?
            <span className="mt-3 block font-semibold text-neutral-900">
              Tip: open two tabs to compare details side by side, or use Compare below.
            </span>
          : null}
        </p>

        {profileId && bestResidenceRow && bestMeta && !loading ?
          <>
            <div className="mt-10">
              <SeniorBestMatchCard
                headline={bestMeta.headline ?? "A strong option based on what you shared"}
                bullets={
                  (
                    bestMeta.bullets?.length ? bestMeta.bullets
                    : bestMeta.reasons?.length ? bestMeta.reasons
                    : bestMeta.explanation
                  )?.slice(0, 4) ?? [careLevelFriendly(bestResidenceRow.careLevel)]
                }
                residenceName={bestResidenceRow.name}
                residenceCity={bestResidenceRow.city}
                province={bestResidenceRow.province}
                detailHref={`${base}/senior-living/${bestResidenceRow.id}`}
                visitHref={`${base}/senior-living/${bestResidenceRow.id}#visit`}
                badgeLabel={abVariant.bestBadge}
                ctaLabel={abVariant.ctaLabel}
              />
            </div>
            <details className="mt-6 rounded-xl border-2 border-neutral-200 bg-white p-4">
              <summary className="cursor-pointer text-lg font-bold text-teal-900">Why these options?</summary>
              <p className="mt-3 text-base leading-relaxed text-neutral-800">
                We match the help level you described, your area when we know it, and what each residence offers. You see
                simple reasons instead of technical scores — always visit in person before you decide.
              </p>
            </details>
          </>
        : null}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="inline-flex rounded-xl border-2 border-neutral-800 bg-white p-1 shadow-sm">
            <button
              type="button"
              className={`min-h-[48px] rounded-lg px-6 text-lg font-bold transition-colors ${
                viewMode === "list" ? "bg-teal-800 text-white" : "bg-transparent text-neutral-800 hover:bg-neutral-100"
              }`}
              aria-pressed={viewMode === "list"}
              onClick={() => {
                setViewMode("list");
                setMapFullscreen(false);
              }}
            >
              List view
            </button>
            <button
              type="button"
              className={`min-h-[48px] rounded-lg px-6 text-lg font-bold transition-colors ${
                viewMode === "map" ? "bg-teal-800 text-white" : "bg-transparent text-neutral-800 hover:bg-neutral-100"
              }`}
              aria-pressed={viewMode === "map"}
              disabled={!mapConfigured}
              title={!mapConfigured ? "Map is not configured (missing Mapbox token)." : undefined}
              onClick={() => setViewMode("map")}
            >
              Map view
            </button>
          </div>
          {!mapConfigured ?
            <p className="text-base font-semibold text-neutral-600">
              Map view stays optional — add a Mapbox token to enable it.
            </p>
          : null}
        </div>

        {filterBar}

        {compareMode ?
          <p className="mt-6 rounded-xl border-2 border-neutral-800 bg-amber-50 p-4 font-semibold text-neutral-900">
            Compare mode: tap up to three residences. Open each one to review with your family.
          </p>
        : null}

        {loading ?
          <p className="mt-10 text-xl font-semibold" aria-live="polite">
            Loading…
          </p>
        : null}

        {/* Desktop: split list | map */}
        {showDesktopSplit ?
          <div className="mt-10 lg:grid lg:grid-cols-[minmax(260px,40%)_minmax(0,60%)] lg:gap-10 lg:items-start">
            <aside className="flex min-h-0 flex-col gap-6 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-3">
              {mapControls}
              <ul className="grid gap-8">{residenceCards}</ul>
            </aside>
            <div className="flex min-h-0 flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
              {touchLarge ?
                <button
                  type="button"
                  className="sl-btn-secondary hidden min-h-[52px] px-6 text-base font-bold lg:inline-flex"
                  onClick={() => setMapFullscreen(true)}
                >
                  Full screen map
                </button>
              : null}
              {mapPanelEl}
            </div>
          </div>
        : null}

        {/* Mobile / tablet: map stacked + drawer */}
        {showMobileMapLayout ?
          <div className="relative mt-8 flex flex-col">
            <div className="relative min-h-[62dvh] w-full">{mapPanelEl}</div>

            <div
              className={`fixed inset-x-0 bottom-0 z-[45] border-t-2 border-neutral-800 bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.12)] transition-[max-height] duration-300 ease-out lg:hidden ${
                drawerOpen ? "max-h-[52vh]" : "max-h-[118px]"
              }`}
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
                <button
                  type="button"
                  className="flex min-h-[48px] flex-1 items-center justify-between text-lg font-bold text-neutral-900"
                  onClick={() => setDrawerOpen((o) => !o)}
                  aria-expanded={drawerOpen}
                >
                  Top matches
                  <span aria-hidden>{drawerOpen ? "▼" : "▲"}</span>
                </button>
                <button
                  type="button"
                  className="sl-btn-secondary min-h-[48px] shrink-0 px-4 text-base font-bold"
                  onClick={() => {
                    setViewMode("list");
                    setMapFullscreen(false);
                  }}
                >
                  Full list
                </button>
              </div>
              <div
                className={`flex gap-4 overflow-x-auto px-4 pb-6 pt-2 snap-x snap-mandatory ${
                  drawerOpen ? "" : "max-h-[72px] overflow-hidden"
                }`}
              >
                {topThreeDrawer.length === 0 ?
                  <p className="pb-4 text-base font-medium text-neutral-600">
                    Map locations will appear here when residences have coordinates.
                  </p>
                : null}
                {topThreeDrawer.map((r) => {
                  const m = matches?.find((x) => x.residenceId === r.id);
                  const isHi = highlightedListId === r.id;
                  return (
                    <div
                      key={`drawer-${r.id}`}
                      className={`min-w-[min(100vw-3rem,320px)] shrink-0 snap-center rounded-xl border-2 p-4 shadow-sm ${
                        isHi ? "border-amber-500 bg-amber-50" : "border-neutral-200 bg-neutral-50"
                      }`}
                    >
                      <p className="text-lg font-bold leading-tight text-neutral-900">{r.name}</p>
                      <p className="mt-2 text-base font-semibold text-neutral-800">{priceLabel(r)}</p>
                      <p className="mt-1 text-sm font-medium text-neutral-700">{careLevelShortLabel(r.careLevel)}</p>
                      <button
                        type="button"
                        className="mt-4 min-h-[48px] w-full rounded-xl bg-neutral-900 px-4 text-base font-bold text-white"
                        onClick={() => {
                          setHighlightedListId(r.id);
                          scrollToResidence(r.id);
                        }}
                      >
                        Show on map & list
                      </button>
                      <Link
                        href={`${base}/senior-living/${r.id}`}
                        className="mt-2 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-neutral-800 bg-white text-base font-bold text-neutral-900 no-underline"
                      >
                        View residence
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        : null}

        {/* Map mode without desktop split: controls + map above full list */}
        {viewMode === "map" && mapConfigured && !showDesktopSplit && !showMobileMapLayout ?
          <div className="mt-10 space-y-6">
            {mapControls}
            {!mapHasPins ?
              <p className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-lg font-semibold text-neutral-900" role="status">
                No map locations yet — use list view or add coordinates to residences.
              </p>
            : (
              mapPanelEl
            )}
          </div>
        : null}

        {/* Default list layout (list view, or map without pins / mid breakpoint) */}
        {!hideStandardListGrid ?
          <ul className="mt-10 grid gap-8 lg:grid-cols-2">{residenceCards}</ul>
        : null}

        {visibleRows.length === 0 && !loading ?
          <p className="mt-10 text-xl font-semibold">
            No residences found. Try another city or use the guided search.
          </p>
        : null}

        {comparePick.length > 0 ?
          <div
            className="fixed bottom-0 left-0 right-0 z-[60] border-t-2 border-neutral-800 bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] md:bottom-4 md:left-auto md:right-4 md:max-w-md md:rounded-xl"
            role="status"
          >
            <p className="font-bold text-neutral-900">{comparePick.length} selected for compare</p>
            <p className="mt-1 text-sm text-neutral-800">
              Open each residence in a new tab to walk through it with your family.
            </p>
          </div>
        : null}
      </div>
    </div>
  );
}
