"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  SYRIA_GOVERNORATES,
  SYRIA_LOCATIONS,
  areaDisplayLabel,
  areaStorageValue,
  findSyriaCityByStored,
} from "@/data/syriaLocations";
import { SyriaCitySelect, SyriaGovernorateSelect } from "@/components/location/SyriaLocationSelects";
import { ListingCard } from "@/components/ListingCard";
import { BrowseMapCanvas } from "@/components/browse/BrowseMapCanvas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ListingGridSkeleton } from "@/components/ListingGridSkeleton";
import { cn } from "@/lib/cn";
import { SYRIA_OFFLINE_NAMESPACE } from "@/lib/offline/constants";
import { normalizeSearchQueryString, searchApiSnapshotKey } from "@/lib/offline/query-normalize";
import { syriaFlags } from "@/lib/platform-flags";
import type { BrowseSurface, SearchPropertiesResult, SerializedBrowseListing } from "@/services/search/search.service";
import { getApiSnapshot, putApiSnapshot, upsertListingMany } from "@repo/offline";
import { SybnbHotelsBrowseStrip } from "@/components/sybnb/SybnbHotelsBrowseStrip";
import { trackClientAnalyticsEvent } from "@/lib/client-analytics";
import { toggleCommaSeparatedAmenityKey } from "@/lib/syria/amenities";

async function persistBrowseSnapshot(surface: BrowseSurface, spSnap: URLSearchParams, bundle: SearchPropertiesResult) {
  const n = normalizeSearchQueryString(spSnap.toString());
  const key = searchApiSnapshotKey(surface, n);
  await putApiSnapshot(SYRIA_OFFLINE_NAMESPACE, key, bundle);
  const rows = new Map<string, unknown>();
  for (const item of bundle.items) {
    rows.set(item.id, item);
  }
  await upsertListingMany(SYRIA_OFFLINE_NAMESPACE, rows);
}

function mergeSearchParams(
  sp: URLSearchParams,
  patch: Record<string, string | undefined>,
  opts?: { resetPage?: boolean },
) {
  const resetPage = opts?.resetPage !== false;
  const n = new URLSearchParams(sp.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === "") n.delete(k);
    else n.set(k, v);
  }
  if (resetPage) n.delete("page");
  return n.toString();
}

function paramsSnapshotEqual(a: string, b: string) {
  const A = new URLSearchParams(a);
  const B = new URLSearchParams(b);
  const keys = new Set([...A.keys(), ...B.keys()]);
  for (const k of keys) {
    if ((A.get(k) ?? "") !== (B.get(k) ?? "")) return false;
  }
  return true;
}

export function BrowseExperienceClient(props: {
  surface: BrowseSurface;
  basePath: string;
  locale: string;
  initialQs: string;
  initialResult: SearchPropertiesResult;
  /** SYBNB-42 — Verified hotels strip (stay surface only). */
  hotelStripItems?: SerializedBrowseListing[];
}) {
  const { surface, basePath, locale, initialQs, initialResult, hotelStripItems } = props;
  const t = useTranslations("Browse");
  const router = useRouter();
  const sp = useSearchParams();

  const [bundle, setBundle] = useState(initialResult);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const seededCacheRef = useRef(false);
  const amenitySearchTrackedKey = useRef<string | null>(null);

  const mapMode = sp.get("map") === "1";

  const cityValue = sp.get("city") ?? "";
  const govValue = sp.get("governorate") ?? "";
  const selectedCity = useMemo(() => findSyriaCityByStored(cityValue)?.city, [cityValue]);

  const govChipLabel = useMemo(() => {
    if (!govValue) return "";
    const row = SYRIA_GOVERNORATES.find((g) => g.name_en === govValue || g.name_ar === govValue);
    return row ? (locale.startsWith("ar") ? row.name_ar : row.name_en) : govValue;
  }, [govValue, locale]);

  const refresh = useCallback(async () => {
    const qs = sp.toString();
    setLoading(true);
    try {
      const res = await fetch(`/api/search?surface=${surface}&${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error("search failed");
      const json = (await res.json()) as SearchPropertiesResult;
      setBundle(json);
      await persistBrowseSnapshot(surface, sp, json);
    } catch {
      if (syriaFlags.SYRIA_OFFLINE_FIRST && typeof navigator !== "undefined") {
        const n = normalizeSearchQueryString(sp.toString());
        const snap = await getApiSnapshot<SearchPropertiesResult>(
          SYRIA_OFFLINE_NAMESPACE,
          searchApiSnapshotKey(surface, n),
        );
        if (snap?.items?.length) setBundle(snap);
      }
    } finally {
      setLoading(false);
    }
  }, [sp, surface]);

  useEffect(() => {
    void (async () => {
      if (!syriaFlags.SYRIA_OFFLINE_FIRST || typeof navigator === "undefined") return;
      const n = normalizeSearchQueryString(sp.toString());
      const snap = await getApiSnapshot<SearchPropertiesResult>(
        SYRIA_OFFLINE_NAMESPACE,
        searchApiSnapshotKey(surface, n),
      );
      if (!snap?.items?.length) return;
      const offlineOnly = navigator.onLine === false;
      if (offlineOnly || initialResult.items.length === 0) {
        setBundle(snap);
      }
    })();
  }, [surface, sp, initialResult.items.length]);

  useEffect(() => {
    if (!syriaFlags.SYRIA_OFFLINE_FIRST || seededCacheRef.current) return;
    seededCacheRef.current = true;
    void persistBrowseSnapshot(surface, new URLSearchParams(initialQs), initialResult);
  }, [surface, initialQs, initialResult]);

  useEffect(() => {
    const raw = sp.get("amenities")?.trim();
    if (!raw) return;
    const key = `${raw}|${bundle.total}|${String(bundle.amenitiesMatchRelaxed ?? false)}|${surface}`;
    if (amenitySearchTrackedKey.current === key) return;
    amenitySearchTrackedKey.current = key;
    trackClientAnalyticsEvent("browse_amenity_search", {
      payload: {
        amenities: raw,
        resultCount: bundle.total,
        relaxed: bundle.amenitiesMatchRelaxed === true,
        surface,
      },
    });
  }, [sp, bundle.total, bundle.amenitiesMatchRelaxed, surface]);

  const skipFirst = useRef(true);
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      if (paramsSnapshotEqual(sp.toString(), initialQs)) return;
    }
    void refresh();
  }, [sp, initialQs, refresh]);

  const replace = useCallback(
    (patch: Record<string, string | undefined>, opts?: { resetPage?: boolean }) => {
      const qs = mergeSearchParams(sp, patch, opts);
      router.replace(qs ? `${basePath}?${qs}` : basePath);
    },
    [router, basePath, sp],
  );

  useEffect(() => {
    if (!govValue || !cityValue) return;
    const g = SYRIA_LOCATIONS.find((row) => row.name_en === govValue);
    if (!g?.cities.some((c) => c.name_en === cityValue)) {
      replace({ city: undefined, area: undefined });
    }
  }, [govValue, cityValue, replace]);

  const qDraft = sp.get("q") ?? "";
  const [qLocal, setQLocal] = useState(qDraft);
  useEffect(() => setQLocal(qDraft), [qDraft]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (qLocal === qDraft) return;
      replace({ q: qLocal.trim() || undefined });
    }, 300);
    return () => window.clearTimeout(id);
  }, [qLocal, qDraft, replace]);

  const loadMore = useCallback(async () => {
    const nextPage = bundle.page + 1;
    const qs = mergeSearchParams(sp, { page: String(nextPage) }, { resetPage: false });
    setLoading(true);
    try {
      const res = await fetch(`/api/search?surface=${surface}&${qs}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as SearchPropertiesResult;
      setBundle((prev) => {
        const merged: SearchPropertiesResult = {
          ...json,
          items: [...prev.items, ...json.items],
          page: json.page,
          hasMore: json.hasMore,
          total: json.total,
          amenitiesMatchRelaxed: json.amenitiesMatchRelaxed ?? prev.amenitiesMatchRelaxed,
        };
        void persistBrowseSnapshot(surface, sp, merged);
        return merged;
      });
    } finally {
      setLoading(false);
    }
  }, [bundle.page, sp, surface]);

  const hasFilters = useMemo(() => {
    const keys = ["q", "city", "governorate", "area", "minPrice", "maxPrice", "beds", "baths", "guests", "amenities", "lat", "lng", "radius"];
    return keys.some((k) => (sp.get(k) ?? "").trim().length > 0) || (sp.get("sort") && sp.get("sort") !== "featured");
  }, [sp]);

  function clearAll() {
    router.replace(basePath);
  }

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "sticky top-14 z-30 -mx-4 border-b border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-4 py-3 md:-mx-0 md:rounded-[var(--darlink-radius-2xl)] md:border md:px-4",
          "[dir=rtl]:text-right",
        )}
      >
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
          <label className="block min-w-[160px] flex-1 text-xs font-medium text-[color:var(--darlink-text-muted)]">
            {t("filterGovernorate")}
            <SyriaGovernorateSelect
              value={govValue}
              onChange={(v) => replace({ governorate: v || undefined, city: undefined, area: undefined })}
              allLabel={t("govAll")}
              className="mt-1 min-h-[44px] w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
            />
          </label>

          <label className="block min-w-[160px] flex-1 text-xs font-medium text-[color:var(--darlink-text-muted)]">
            {t("filterCity")}
            <SyriaCitySelect
              value={cityValue}
              onChange={(v) =>
                replace({
                  city: v || undefined,
                  area: undefined,
                  governorate: v ? undefined : govValue || undefined,
                })
              }
              governorateFilterEn={govValue || undefined}
              allLabel={t("cityAll")}
              className="mt-1 min-h-[44px] w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
            />
          </label>

          <label className="block min-w-[160px] flex-1 text-xs font-medium text-[color:var(--darlink-text-muted)]">
            {t("filterArea")}
            <select
              value={sp.get("area") ?? ""}
              onChange={(e) => replace({ area: e.target.value || undefined })}
              disabled={!selectedCity}
              className="mt-1 min-h-[44px] w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)] disabled:opacity-50"
            >
              <option value="">{t("areaAll")}</option>
              {(selectedCity?.areas ?? []).map((a) => (
                <option key={areaStorageValue(a)} value={areaStorageValue(a)}>
                  {areaDisplayLabel(a, locale)}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-[200px] flex-[1.3] text-xs font-medium text-[color:var(--darlink-text-muted)]">
            {t("filterKeywords")}
            <Input value={qLocal} onChange={(e) => setQLocal(e.target.value)} className="mt-1 min-h-[44px]" />
          </label>

          <div className="flex flex-wrap gap-2 md:items-center">
            <button
              type="button"
              onClick={() => replace({ map: mapMode ? undefined : "1" })}
              className={cn(
                "min-h-[44px] rounded-[var(--darlink-radius-lg)] border px-4 text-sm font-semibold transition",
                mapMode
                  ? "border-[color:var(--darlink-accent)] bg-[color:var(--darlink-accent)]/10 text-[color:var(--darlink-accent)]"
                  : "border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] text-[color:var(--darlink-text)]",
              )}
            >
              {t("mapView")}
            </button>
            <button
              type="button"
              className="min-h-[44px] rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] px-4 text-sm font-semibold text-[color:var(--darlink-text)] md:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              {t("openFilters")}
            </button>
          </div>
        </div>

        {surface === "stay" || surface === "bnhub" ? <StayAmenityQuickFilters sp={sp} replace={replace} /> : null}

        <div className="mt-3 hidden flex-wrap gap-2 md:flex">
          <FilterFields sp={sp} replace={replace} surface={surface} />
          {hasFilters ? (
            <button type="button" onClick={clearAll} className="text-sm font-semibold text-[color:var(--darlink-accent)]">
              {t("clearFilters")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-[44px] flex-wrap items-center gap-2 text-xs text-[color:var(--darlink-text-muted)]">
        <span className="font-semibold uppercase tracking-wide text-[color:var(--darlink-text)]">{t("activeFilters")}</span>
        {hasFilters ? (
          <>
            {cityValue ? (
              <span className="rounded-full bg-[color:var(--darlink-sand)]/35 px-2.5 py-1 font-medium ring-1 ring-[color:var(--darlink-border)]">{cityValue}</span>
            ) : null}
            {(sp.get("area") ?? "").trim() ? (
              <span className="rounded-full bg-[color:var(--darlink-surface-muted)] px-2.5 py-1 ring-1 ring-[color:var(--darlink-border)]">{sp.get("area")}</span>
            ) : null}
            {(sp.get("minPrice") ?? "").trim() || (sp.get("maxPrice") ?? "").trim() ? (
              <span className="rounded-full px-2.5 py-1 ring-1 ring-[color:var(--darlink-border)]">
                {sp.get("minPrice") ?? "…"} – {sp.get("maxPrice") ?? "…"}
              </span>
            ) : null}
            {(sp.get("amenities") ?? "").trim() ? (
              <span
                className="max-w-[min(100%,14rem)] truncate rounded-full bg-[color:var(--darlink-surface-muted)] px-2.5 py-1 ring-1 ring-[color:var(--darlink-border)]"
                title={sp.get("amenities") ?? ""}
              >
                {sp.get("amenities")}
              </span>
            ) : null}
          </>
        ) : (
          <span>{t("noActiveFilters")}</span>
        )}
        <span className="ms-auto tabular-nums text-[color:var(--darlink-text)]">
          {bundle.total} {t("resultsCount")}
        </span>
      </div>

      {surface === "stay" && bundle.amenitiesMatchRelaxed && (sp.get("amenities") ?? "").trim() ? (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-950 [dir=rtl]:text-right">
          {t("amenityFallbackBanner")}
        </p>
      ) : null}

      {loading && bundle.items.length === 0 ? <ListingGridSkeleton count={8} /> : null}

      <div
        className={cn(
          mapMode ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,42%)] lg:items-start" : "",
          "[dir=rtl]:lg:grid-flow-col-dense",
        )}
      >
        {mapMode ? (
          <div className={cn("min-h-[320px] lg:sticky lg:top-[7.5rem]", "[dir=rtl]:lg:col-start-2")}>
            <BrowseMapCanvas
              listings={bundle.items}
              selectedId={selectedId}
              onMarkerClick={(id) => setSelectedId(id)}
              searchAreaLabel={t("mapSearchArea")}
              onSearchThisArea={({ lat, lng, radiusKm }) => {
                replace({
                  lat: String(lat),
                  lng: String(lng),
                  radius: String(Math.min(Math.round(radiusKm * 10) / 10, 80)),
                  map: "1",
                });
              }}
              height={360}
            />
          </div>
        ) : null}

        <div className={cn("min-w-0 space-y-4", mapMode ? "[dir=rtl]:lg:col-start-1" : "")}>
          {surface === "stay" && hotelStripItems && hotelStripItems.length > 0 ? (
            <SybnbHotelsBrowseStrip items={hotelStripItems} locale={locale} />
          ) : null}
          {bundle.items.length === 0 && !loading ? (
            <div className="rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)]/40 px-6 py-16 text-center">
              <p className="text-lg font-semibold text-[color:var(--darlink-text)]">
                {hasFilters ? t("emptyNoMatchTitle") : t("emptyResultsTitle")}
              </p>
              <p className="mt-2 text-sm text-[color:var(--darlink-text-muted)]">
                {hasFilters ? t("emptyNoMatchHint") : t("emptyResultsHint")}
              </p>
              {hasFilters ? (
                <Button type="button" variant="secondary" className="mt-6" onClick={clearAll}>
                  {t("clearFilters")}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {bundle.items.map((l, i) => (
                <div
                  key={l.id}
                  className={cn(selectedId === l.id ? "ring-2 ring-[color:var(--darlink-accent)] ring-offset-2 ring-offset-[color:var(--darlink-surface)]" : "")}
                >
                  <ListingCard listing={l} locale={locale} priority={i < 6} />
                </div>
              ))}
            </div>
          )}

          {bundle.hasMore ? (
            <div className="flex justify-center pt-2">
              <Button type="button" variant="secondary" className="min-h-[48px] min-w-[200px]" disabled={loading} onClick={() => void loadMore()}>
                {loading ? t("loadingMore") : t("loadMore")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-[color:var(--darlink-navy)]/40" aria-label={t("closeFilters")} onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[var(--darlink-radius-3xl)] border-t border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 pb-10 shadow-[var(--darlink-shadow-sm)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("filterSheetTitle")}</h2>
              <button type="button" className="text-sm font-semibold text-[color:var(--darlink-accent)]" onClick={() => setDrawerOpen(false)}>
                {t("closeFilters")}
              </button>
            </div>
            <div className="space-y-4">
              {surface === "stay" || surface === "bnhub" ? <StayAmenityQuickFilters sp={sp} replace={replace} /> : null}
              <FilterFields sp={sp} replace={replace} surface={surface} />
              <Button
                type="button"
                variant="primary"
                className="w-full min-h-[48px]"
                onClick={() => {
                  setDrawerOpen(false);
                  void refresh();
                }}
              >
                {t("applyFilters")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StayAmenityQuickFilters({
  sp,
  replace,
}: {
  sp: URLSearchParams;
  replace: (patch: Record<string, string | undefined>) => void;
}) {
  const t = useTranslations("Browse");
  const raw = sp.get("amenities") ?? "";
  const tags = raw
    .split(/[,;\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const active = (key: string) => tags.includes(key);

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-[color:var(--darlink-border)] pt-3 md:border-t-0 md:pt-0">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--darlink-text-muted)]">
        {t("quickAmenityShortcutsLabel")}
      </span>
      <button
        type="button"
        onClick={() => replace({ amenities: toggleCommaSeparatedAmenityKey(raw, "electricity_24h") })}
        className={cn(
          "min-h-[36px] rounded-full border px-3 text-xs font-semibold transition",
          active("electricity_24h") ?
            "border-amber-400 bg-amber-50 text-amber-950"
          : "border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] text-[color:var(--darlink-text)]",
        )}
      >
        ⚡ {t("quickFilterElectricity")}
      </button>
      <button
        type="button"
        onClick={() => replace({ amenities: toggleCommaSeparatedAmenityKey(raw, "wifi") })}
        className={cn(
          "min-h-[36px] rounded-full border px-3 text-xs font-semibold transition",
          active("wifi") ?
            "border-emerald-400 bg-emerald-50 text-emerald-950"
          : "border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] text-[color:var(--darlink-text)]",
        )}
      >
        📶 {t("quickFilterWifi")}
      </button>
    </div>
  );
}

function FilterFields({
  sp,
  replace,
  surface,
}: {
  sp: URLSearchParams;
  replace: (patch: Record<string, string | undefined>) => void;
  surface: BrowseSurface;
}) {
  const t = useTranslations("Browse");
  return (
    <>
      <label className="block text-xs font-medium text-[color:var(--darlink-text-muted)]">
        {t("filterSort")}
        <select
          value={sp.get("sort") ?? "featured"}
          onChange={(e) => replace({ sort: e.target.value === "featured" ? undefined : e.target.value })}
          className="mt-1 min-h-[44px] w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm"
        >
          <option value="featured">{t("sortFeatured")}</option>
          <option value="new">{t("sortNew")}</option>
          <option value="price_asc">{t("sortPriceAsc")}</option>
          <option value="price_desc">{t("sortPriceDesc")}</option>
          {sp.get("lat") && sp.get("lng") ? <option value="distance">{t("sortDistance")}</option> : null}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-[color:var(--darlink-text-muted)]">
          {t("minPrice")}
          <Input
            inputMode="numeric"
            value={sp.get("minPrice") ?? ""}
            onChange={(e) => replace({ minPrice: e.target.value.trim() || undefined })}
            className="mt-1 min-h-[44px]"
          />
        </label>
        <label className="block text-xs font-medium text-[color:var(--darlink-text-muted)]">
          {t("maxPrice")}
          <Input
            inputMode="numeric"
            value={sp.get("maxPrice") ?? ""}
            onChange={(e) => replace({ maxPrice: e.target.value.trim() || undefined })}
            className="mt-1 min-h-[44px]"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-[color:var(--darlink-text-muted)]">
          {t("filterBeds")}
          <Input
            inputMode="numeric"
            value={sp.get("beds") ?? ""}
            onChange={(e) => replace({ beds: e.target.value.trim() || undefined })}
            className="mt-1 min-h-[44px]"
          />
        </label>
        <label className="block text-xs font-medium text-[color:var(--darlink-text-muted)]">
          {t("filterBaths")}
          <Input
            inputMode="numeric"
            value={sp.get("baths") ?? ""}
            onChange={(e) => replace({ baths: e.target.value.trim() || undefined })}
            className="mt-1 min-h-[44px]"
          />
        </label>
      </div>
      {surface === "bnhub" ? (
        <label className="block text-xs font-medium text-[color:var(--darlink-text-muted)]">
          {t("filterGuests")}
          <Input
            inputMode="numeric"
            value={sp.get("guests") ?? ""}
            onChange={(e) => replace({ guests: e.target.value.trim() || undefined })}
            className="mt-1 min-h-[44px]"
          />
        </label>
      ) : null}
      <label className="block text-xs font-medium text-[color:var(--darlink-text-muted)]">
        {t("filterAmenities")}
        <Input value={sp.get("amenities") ?? ""} onChange={(e) => replace({ amenities: e.target.value.trim() || undefined })} className="mt-1 min-h-[44px]" />
      </label>
    </>
  );
}
