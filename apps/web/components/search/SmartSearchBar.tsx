"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { UserProfile } from "@/lib/ai/userProfile";
import { trackEvent } from "@/src/services/analytics";
import { cn } from "@/lib/utils";

const RECENT_KEY = "lecipm_smart_search_recent";
const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;

export type SmartSearchBarProps = {
  defaultCity?: string;
  userProfile?: UserProfile;
  /** `FLAGS.RECOMMENDATIONS` from server — when false, render a plain text input (no typeahead). */
  suggestionsEnabled: boolean;
  /** e.g. `/en/ca/listings` — `?city=` is appended for city navigation. */
  listingsBaseHref: string;
  /** e.g. `/en/ca/bnhub/listings` — link is `${base}/${id}`. */
  listingDetailBaseHref: string;
  className?: string;
};

type SuggestState = {
  cities: string[];
  listings: { id: string; title: string; city: string; price: number }[];
};

type FlatItem =
  | { kind: "city"; city: string }
  | { kind: "listing"; id: string; title: string }
  | { kind: "recent"; text: string };

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function writeRecent(s: string) {
  if (typeof window === "undefined" || !s.trim()) return;
  const t = s.trim();
  const prev = readRecent().filter((x) => x.toLowerCase() !== t.toLowerCase());
  prev.unshift(t);
  localStorage.setItem(RECENT_KEY, JSON.stringify(prev.slice(0, MAX_RECENT)));
}

function withCityQuery(base: string, city: string): string {
  if (!base) return `?city=${encodeURIComponent(city)}`;
  try {
    const u = new URL(base, "https://prefill.lecipm.invalid");
    if (!u.searchParams.has("city")) u.searchParams.set("city", city);
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return `${base}${base.includes("?") ? "&" : "?"}city=${encodeURIComponent(city)}`;
  }
}

function listingHref(detailBase: string, id: string): string {
  const sep = detailBase.endsWith("/") ? "" : "/";
  return `${detailBase}${sep}${id}`;
}

export function SmartSearchBar({
  defaultCity = "",
  userProfile,
  suggestionsEnabled,
  listingsBaseHref,
  listingDetailBaseHref,
  className = "",
}: SmartSearchBarProps) {
  const elId = useId();
  const router = useRouter();
  const [value, setValue] = useState(defaultCity);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggest, setSuggest] = useState<SuggestState>({ cities: [], listings: [] });
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const preferred = userProfile?.preferredCities?.filter(Boolean) ?? [];
  const prefParam = useMemo(() => preferred.join(","), [preferred.join("|")]);

  const flatItems = useMemo((): FlatItem[] => {
    const f: FlatItem[] = [];
    for (const c of suggest.cities) f.push({ kind: "city", city: c });
    for (const l of suggest.listings) f.push({ kind: "listing", id: l.id, title: l.title });
    if (value.trim() === "" && recent.length) {
      for (const r of recent) f.push({ kind: "recent", text: r });
    }
    return f;
  }, [suggest, recent, value]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  useEffect(() => {
    setActive(-1);
  }, [suggest.cities, suggest.listings]);

  const runFetch = useCallback(
    async (q: string) => {
      if (!q.trim() || !suggestionsEnabled) {
        setLoading(false);
        setSuggest({ cities: [], listings: [] });
        return;
      }
      setLoading(true);
      try {
        const u = new URL("/api/search/suggest", globalThis.location.origin);
        u.searchParams.set("q", q);
        if (prefParam) u.searchParams.set("prefCities", prefParam);
        const res = await fetch(u.toString());
        if (!res.ok) {
          setSuggest({ cities: [], listings: [] });
          return;
        }
        const data = (await res.json()) as SuggestState;
        setSuggest({
          cities: Array.isArray(data.cities) ? data.cities : [],
          listings: Array.isArray(data.listings) ? data.listings : [],
        });
        void trackEvent("search_used", { query: q });
      } catch {
        setSuggest({ cities: [], listings: [] });
      } finally {
        setLoading(false);
      }
    },
    [prefParam, suggestionsEnabled]
  );

  useEffect(() => {
    if (!suggestionsEnabled) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value;
    if (!q.trim()) {
      setSuggest({ cities: [], listings: [] });
      return;
    }
    debounceRef.current = setTimeout(() => {
      void runFetch(q);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, runFetch, suggestionsEnabled]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActive(-1);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const onPickCity = (city: string) => {
    const href = withCityQuery(listingsBaseHref, city);
    writeRecent(city);
    setRecent(readRecent());
    setOpen(false);
    void trackEvent("search_result_clicked", { type: "city" as const, city });
    router.push(href);
  };

  const onPickListing = (id: string, title: string) => {
    const href = listingHref(listingDetailBaseHref, id);
    writeRecent(title);
    setRecent(readRecent());
    setOpen(false);
    void trackEvent("search_result_clicked", { type: "listing" as const, id });
    router.push(href);
  };

  const onPickRecent = (s: string) => {
    setValue(s);
    setOpen(true);
    void runFetch(s);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestionsEnabled) {
      if (e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flatItems.length === 0) return;
      setOpen(true);
      setActive((a) => (a + 1) % flatItems.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatItems.length === 0) return;
      setOpen(true);
      setActive((a) => (a <= 0 ? flatItems.length - 1 : a - 1));
      return;
    }
    if (e.key === "Enter" && open && active >= 0 && active < flatItems.length) {
      e.preventDefault();
      const it = flatItems[active]!;
      if (it.kind === "city") onPickCity(it.city);
      else if (it.kind === "listing") onPickListing(it.id, it.title);
      else onPickRecent(it.text);
    }
  };

  const showDropdown =
    open && (suggest.cities.length > 0 || suggest.listings.length > 0 || (value.trim() === "" && recent.length > 0));
  const showEmpty = open && !loading && value.trim() && suggest.cities.length === 0 && suggest.listings.length === 0;

  if (!suggestionsEnabled) {
    return (
      <div className={cn("mx-auto w-full max-w-lg px-0", className)}>
        <label htmlFor={`${elId}-q`} className="sr-only">
          Search listings or cities
        </label>
        <input
          id={`${elId}-q`}
          type="search"
          className="w-full rounded-xl border border-zinc-200 bg-background px-4 py-3 text-sm text-foreground shadow-sm dark:border-zinc-700"
          placeholder="Search (enable recommendations for typeahead)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative z-40 mx-auto w-full max-w-lg px-0", className)}>
      <label htmlFor={`${elId}-q`} className="sr-only">
        Search cities or stay listings
      </label>
      <input
        id={`${elId}-q`}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${elId}-listbox`}
        className="w-full rounded-xl border border-zinc-200 bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-zinc-700"
        placeholder="Search a city or listing…"
        value={value}
        autoComplete="off"
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
      />
      {loading ? (
        <div
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-zinc-300 border-t-amber-600"
          aria-hidden
        />
      ) : null}
      {showDropdown ? (
        <div
          id={`${elId}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-zinc-200 bg-background py-1 text-left text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          {suggest.cities.length > 0 ? (
            <div className="px-2 py-1">
              <p className="px-2 py-1 text-xs font-medium uppercase text-muted-foreground">Suggested cities</p>
              {suggest.cities.map((c, i) => {
                const g = i;
                const isAct = open && active === g;
                return (
                  <button
                    key={`c-${c}-${i}`}
                    type="button"
                    role="option"
                    aria-selected={isAct}
                    className={cn(
                      "flex w-full rounded-lg px-2 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      isAct && "bg-amber-500/10"
                    )}
                    onMouseEnter={() => setActive(g)}
                    onClick={() => onPickCity(c)}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          ) : null}
          {suggest.listings.length > 0 ? (
            <div className="border-t border-zinc-100 px-2 py-1 dark:border-zinc-800">
              <p className="px-2 py-1 text-xs font-medium uppercase text-muted-foreground">Listings</p>
              {suggest.listings.map((l, j) => {
                const g = suggest.cities.length + j;
                const isAct = open && active === g;
                return (
                  <button
                    key={l.id}
                    type="button"
                    role="option"
                    aria-selected={isAct}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-lg px-2 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      isAct && "bg-amber-500/10"
                    )}
                    onMouseEnter={() => setActive(g)}
                    onClick={() => onPickListing(l.id, l.title)}
                  >
                    <span className="line-clamp-1 font-medium">{l.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {l.city} · {l.price > 0 ? `from $${l.price.toFixed(0)}/night` : "See price"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {value.trim() === "" && recent.length > 0 ? (
            <div className="border-t border-zinc-100 px-2 py-1 dark:border-zinc-800">
              <p className="px-2 py-1 text-xs font-medium uppercase text-muted-foreground">Recent</p>
              {recent.map((r, k) => {
                const g = suggest.cities.length + suggest.listings.length + k;
                const isAct = open && active === g;
                return (
                  <button
                    key={`r-${r}-${k}`}
                    type="button"
                    className={cn(
                      "flex w-full rounded-lg px-2 py-2 text-left text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      isAct && "bg-amber-500/10"
                    )}
                    onMouseEnter={() => setActive(g)}
                    onClick={() => onPickRecent(r)}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
      {showEmpty ? (
        <div
          className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-zinc-200 bg-background px-3 py-4 text-center text-sm text-muted-foreground shadow-lg"
          role="status"
        >
          Try searching another city or listing
        </div>
      ) : null}
    </div>
  );
}
