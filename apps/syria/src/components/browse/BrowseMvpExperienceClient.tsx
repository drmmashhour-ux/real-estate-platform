"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ListingCard } from "@/components/ListingCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SYRIA_STATE_OPTIONS } from "@/lib/syria/states";
import { MARKETPLACE_CATEGORIES, MARKETPLACE_SUBCATEGORIES, type MarketplaceCategory } from "@/lib/marketplace-categories";
import { SYRIA_AMENITIES, parseFeaturesQuery } from "@/lib/syria/amenities";
import type { BrowseSurface, SearchPropertiesResult } from "@/services/search/search.service";

function buildQuery(
  state: string,
  city: string,
  minP: string,
  maxP: string,
  sort: string,
  featuresCsv: string,
  category: string,
  subcategory: string,
  directOnly: boolean,
) {
  const n = new URLSearchParams();
  if (state.trim()) n.set("state", state.trim());
  if (city.trim()) n.set("city", city.trim());
  if (minP.trim()) n.set("minPrice", minP.trim());
  if (maxP.trim()) n.set("maxPrice", maxP.trim());
  if (sort && sort !== "featured") n.set("sort", sort);
  if (featuresCsv.trim()) n.set("features", featuresCsv.trim());
  if (category.trim()) n.set("category", category.trim());
  if (subcategory.trim()) n.set("subcategory", subcategory.trim());
  if (directOnly) n.set("direct", "1");
  return n.toString();
}

export function BrowseMvpExperienceClient(props: {
  surface: BrowseSurface;
  basePath: string;
  locale: string;
  initialResult: SearchPropertiesResult;
}) {
  const { surface, basePath, locale, initialResult } = props;
  const t = useTranslations("Browse");
  const tCat = useTranslations("Categories");
  const ulocale = useLocale();
  const isAr = ulocale.startsWith("ar");
  const router = useRouter();
  const sp = useSearchParams();
  const [bundle, setBundle] = useState(initialResult);
  const [loading, setLoading] = useState(false);
  const st = sp.get("state") ?? "";
  const city = sp.get("city") ?? "";
  const minP = sp.get("minPrice") ?? "";
  const maxP = sp.get("maxPrice") ?? "";
  const sort = sp.get("sort") ?? "featured";
  const featuresQ = sp.get("features") ?? "";
  const mcat = sp.get("category") ?? "";
  const msub = sp.get("subcategory") ?? "";
  const directQ = sp.get("direct") === "1";
  const [stateL, setStateL] = useState(st);
  const [cityL, setCityL] = useState(city);
  const [minL, setMinL] = useState(minP);
  const [maxL, setMaxL] = useState(maxP);
  const [sortL, setSortL] = useState(sort);
  const [featureKeysL, setFeatureKeysL] = useState(() => parseFeaturesQuery(featuresQ));
  const [mcatL, setMcatL] = useState(mcat);
  const [msubL, setMsubL] = useState(msub);
  const [directL, setDirectL] = useState(directQ);
  const skip = useRef(true);

  useEffect(() => {
    setStateL(st);
    setCityL(city);
    setMinL(minP);
    setMaxL(maxP);
    setSortL(sort);
    setFeatureKeysL(parseFeaturesQuery(featuresQ));
    setMcatL(mcat);
    setMsubL(msub);
  }, [st, city, minP, maxP, sort, featuresQ, mcat, msub]);

  const refresh = useCallback(async () => {
    const qs = sp.toString();
    setLoading(true);
    try {
      const res = await fetch(`/api/search?surface=${surface}&${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error("search");
      setBundle((await res.json()) as SearchPropertiesResult);
    } finally {
      setLoading(false);
    }
  }, [sp, surface]);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    void refresh();
  }, [sp, refresh]);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const qs = buildQuery(stateL, cityL, minL, maxL, sortL, featureKeysL.join(","), mcatL, msubL, directL);
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  const subOptions =
    mcatL && (MARKETPLACE_CATEGORIES as readonly string[]).includes(mcatL)
      ? [...MARKETPLACE_SUBCATEGORIES[mcatL as MarketplaceCategory]]
      : [];

  return (
    <div className="space-y-6">
      <form
        onSubmit={apply}
        className="grid gap-3 rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div className="flex items-center gap-2 rounded-[var(--darlink-radius-lg)] border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 sm:col-span-2 lg:col-span-3 [dir:rtl]:text-right">
          <input
            type="checkbox"
            id="mvp-filter-direct"
            checked={directL}
            onChange={(e) => setDirectL(e.target.checked)}
            className="size-4 rounded border-[color:var(--darlink-border)] text-emerald-600"
          />
          <label htmlFor="mvp-filter-direct" className="text-sm font-medium text-[color:var(--darlink-text)]">
            {t("filterDirectOnly")}
          </label>
        </div>
        <label className="text-sm text-[color:var(--darlink-text-muted)] sm:col-span-2 lg:col-span-1">
          {t("filterCategory")}
          <select
            value={mcatL}
            onChange={(e) => {
              setMcatL(e.target.value);
              setMsubL("");
            }}
            className="mt-1 w-full min-h-11 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm"
            name="category"
          >
            <option value="">{t("categoryAll")}</option>
            {MARKETPLACE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {tCat(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[color:var(--darlink-text-muted)] sm:col-span-2 lg:col-span-1">
          {t("filterSubcategory")}
          <select
            value={msubL}
            onChange={(e) => setMsubL(e.target.value)}
            className="mt-1 w-full min-h-11 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm"
            name="subcategory"
            disabled={!mcatL}
          >
            <option value="">{t("subcategoryAll")}</option>
            {subOptions.map((s) => (
              <option key={s} value={s}>
                {(tCat as (k: string) => string)(`sub_${s}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[color:var(--darlink-text-muted)]">
          {t("filterState")}
          <select
            name="state"
            value={stateL}
            onChange={(e) => setStateL(e.target.value)}
            className="mt-1 w-full min-h-11 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm"
          >
            <option value="">{t("stateAll")}</option>
            {SYRIA_STATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {isAr ? o.labelAr : o.labelEn}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[color:var(--darlink-text-muted)] sm:col-span-1">
          {t("filterCity")}
          <Input value={cityL} onChange={(e) => setCityL(e.target.value)} className="mt-1" name="city" />
        </label>
        <label className="text-sm text-[color:var(--darlink-text-muted)]">
          {t("minPrice")}
          <Input value={minL} onChange={(e) => setMinL(e.target.value)} inputMode="numeric" className="mt-1" name="minPrice" />
        </label>
        <label className="text-sm text-[color:var(--darlink-text-muted)]">
          {t("maxPrice")}
          <Input value={maxL} onChange={(e) => setMaxL(e.target.value)} inputMode="numeric" className="mt-1" name="maxPrice" />
        </label>
        <label className="text-sm text-[color:var(--darlink-text-muted)] sm:col-span-2 lg:col-span-1">
          {t("filterSort")}
          <select
            value={sortL}
            onChange={(e) => setSortL(e.target.value)}
            className="mt-1 w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm"
            name="sort"
          >
            <option value="featured">{t("sortFeatured")}</option>
            <option value="newest">{t("sortNew")}</option>
            <option value="price_asc">{t("sortPriceAsc")}</option>
            <option value="price_desc">{t("sortPriceDesc")}</option>
          </select>
        </label>
        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
          <p className="text-sm font-medium text-[color:var(--darlink-text-muted)]">{t("filterFeatures")}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" dir={isAr ? "rtl" : "ltr"}>
            {SYRIA_AMENITIES.map((a) => {
              const on = featureKeysL.includes(a.key);
              return (
                <label
                  key={a.key}
                  className="flex cursor-pointer items-center gap-2 rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => {
                      setFeatureKeysL((prev) => (on ? prev.filter((k) => k !== a.key) : [...prev, a.key]));
                    }}
                    className="size-4 rounded border-[color:var(--darlink-border)]"
                  />
                  <span className="text-[color:var(--darlink-text)]">{isAr ? a.label_ar : a.label_en}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-2">
          <Button type="submit" variant="primary" className="w-full min-h-11" disabled={loading}>
            {t("applyFilters")}
          </Button>
        </div>
      </form>

      {loading ? <p className="text-sm text-[color:var(--darlink-text-muted)]">{t("loadingMore")}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bundle.items.map((l, i) => (
          <ListingCard key={l.id} listing={l} locale={locale} priority={i < 6} />
        ))}
      </div>
    </div>
  );
}
