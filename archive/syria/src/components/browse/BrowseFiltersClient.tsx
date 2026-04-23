"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Props = {
  basePath: string;
  defaultQ: string;
  defaultCity: string;
  defaultSort: string;
};

export function BrowseFiltersClient({ basePath, defaultQ, defaultCity, defaultSort }: Props) {
  const t = useTranslations("Browse");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(defaultQ);
  const [city, setCity] = useState(defaultCity);
  const [sort, setSort] = useState(defaultSort);

  useEffect(() => {
    setQ(defaultQ);
    setCity(defaultCity);
    setSort(defaultSort);
  }, [defaultQ, defaultCity, defaultSort]);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (city.trim()) params.set("city", city.trim());
    if (sort && sort !== "featured") params.set("sort", sort);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
    setOpen(false);
  }

  function clearFilters() {
    setQ("");
    setCity("");
    setSort("featured");
    router.push(basePath);
    setOpen(false);
  }

  const hasFilters = Boolean(q.trim() || city.trim() || (sort && sort !== "featured"));

  const fields = (
    <>
      <label className="block text-sm text-[color:var(--darlink-text-muted)]">
        {t("filterCity")}
        <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" />
      </label>
      <label className="block text-sm text-[color:var(--darlink-text-muted)]">
        {t("filterKeywords")}
        <Input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1" />
      </label>
      <label className="block text-sm text-[color:var(--darlink-text-muted)]">
        {t("filterSort")}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="mt-1 w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-3 py-2 text-sm text-[color:var(--darlink-text)]"
        >
          <option value="featured">{t("sortFeatured")}</option>
          <option value="new">{t("sortNew")}</option>
          <option value="price_asc">{t("sortPriceAsc")}</option>
        </select>
      </label>
    </>
  );

  const actions = (
    <div className="flex flex-wrap gap-2 md:flex-col md:justify-end">
      <Button type="submit" variant="primary" className="w-full sm:w-auto">
        {t("applyFilters")}
      </Button>
      {hasFilters ? (
        <button
          type="button"
          onClick={clearFilters}
          className="w-full rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] px-4 py-2 text-sm font-medium text-[color:var(--darlink-text)] hover:bg-[color:var(--darlink-surface-muted)] sm:w-auto"
        >
          {t("clearFilters")}
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-h-9 flex-wrap items-center gap-2 text-xs text-[color:var(--darlink-text-muted)]">
          {hasFilters ? (
            <>
              <span className="font-semibold uppercase tracking-wide text-[color:var(--darlink-text)]">{t("activeFilters")}</span>
              {city.trim() ? (
                <span className="rounded-full bg-[color:var(--darlink-sand)]/35 px-2.5 py-1 font-medium text-[color:var(--darlink-text)] ring-1 ring-[color:var(--darlink-border)]">
                  {city}
                </span>
              ) : null}
              {q.trim() ? (
                <span className="rounded-full bg-[color:var(--darlink-surface-muted)] px-2.5 py-1 font-medium ring-1 ring-[color:var(--darlink-border)]">
                  {q}
                </span>
              ) : null}
              {sort && sort !== "featured" ? (
                <span className="rounded-full bg-[color:var(--darlink-accent)]/10 px-2.5 py-1 font-medium text-[color:var(--darlink-accent)] ring-1 ring-[color:var(--darlink-accent)]/25">
                  {sort}
                </span>
              ) : null}
            </>
          ) : (
            <span>{t("noActiveFilters")}</span>
          )}
        </div>
        <button
          type="button"
          className="rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--darlink-text)] shadow-[var(--darlink-shadow-sm)] md:hidden"
          onClick={() => setOpen(true)}
        >
          {t("openFilters")}
        </button>
      </div>

      <form
        onSubmit={apply}
        className="hidden rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-4 shadow-[var(--darlink-shadow-sm)] md:block"
      >
        <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-9">{fields}</div>
          <div className="lg:col-span-3">{actions}</div>
        </div>
      </form>

      {open ? (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label={t("filterSheetTitle")}>
          <button type="button" className="absolute inset-0 bg-[color:var(--darlink-navy)]/40" aria-label={t("closeFilters")} onClick={() => setOpen(false)} />
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[var(--darlink-radius-3xl)] bg-[color:var(--darlink-surface)] p-6 pb-10 shadow-[var(--darlink-shadow-xl)]",
              "[dir=rtl]:text-right",
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-[color:var(--darlink-text)]">{t("filterSheetTitle")}</h2>
              <button type="button" className="text-sm font-medium text-[color:var(--darlink-accent)]" onClick={() => setOpen(false)}>
                {t("closeFilters")}
              </button>
            </div>
            <form onSubmit={apply} className="space-y-4">
              {fields}
              {actions}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
