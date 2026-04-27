"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export type StayRecommendationItem = {
  id: string;
  listingCode: string | null;
  title: string;
  city: string;
  nightPriceCents: number;
  propertyType: string | null;
  score: number;
  rating: number | null;
};

type Props = {
  listingId: string;
  title?: string;
  /** e.g. dark for BNHub public stay page */
  variant?: "dark" | "light";
  className?: string;
};

/**
 * Fetches `GET /api/recommendations/:id` and renders a small grid of similar stays.
 */
export function Recommendations({ listingId, title = "You may also like", variant = "light", className = "" }: Props) {
  const params = useParams() as { locale?: string; country?: string } | null;
  const locale = params?.locale ?? "en";
  const country = params?.country ?? "ca";
  const base = `/${locale}/${country}`;

  const [items, setItems] = useState<StayRecommendationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/recommendations/${encodeURIComponent(listingId)}`, { credentials: "same-origin" });
        if (cancelled) return;
        if (!r.ok) throw new Error("load_failed");
        const j = (await r.json()) as { items?: StayRecommendationItem[] };
        setItems(j.items ?? []);
        setError(null);
      } catch {
        if (!cancelled) setError("Couldn’t load suggestions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const isDark = variant === "dark";
  if (loading) {
    return (
      <div className={className}>
        <h2
          className={
            isDark
              ? "text-lg font-semibold text-white"
              : "text-lg font-semibold text-slate-900"
          }
        >
          {title}
        </h2>
        <p className={isDark ? "mt-2 text-sm text-white/50" : "mt-2 text-sm text-slate-500"}>Loading…</p>
      </div>
    );
  }
  if (error || !items || items.length === 0) {
    return null;
  }

  return (
    <div className={className} data-recommendations="1">
      <h2
        className={
          isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-900"
        }
      >
        {title}
      </h2>
      <div
        className={
          isDark
            ? "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
            : "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
        }
      >
        {items.map((i) => {
          const href = `${base}/listings/${encodeURIComponent(i.listingCode ?? i.id)}`;
          const price = (i.nightPriceCents / 100).toFixed(0);
          return (
            <Link
              key={i.id}
              href={href}
              className={
                isDark
                  ? "block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  : "block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
              }
            >
              <div
                className={
                  isDark ? "font-medium text-white line-clamp-2" : "font-medium text-slate-900 line-clamp-2"
                }
              >
                {i.title}
              </div>
              <div className={isDark ? "mt-1 text-sm text-white/50" : "mt-1 text-sm text-slate-500"}>
                {i.city}
                {i.propertyType ? ` · ${i.propertyType}` : ""}
                {i.rating != null && i.rating >= 4.5 ? ` · ★ ${i.rating.toFixed(1)}` : ""}
              </div>
              <div
                className={
                  isDark
                    ? "mt-2 text-base font-semibold tabular-nums text-[#D4AF37]"
                    : "mt-2 text-base font-semibold tabular-nums text-indigo-700"
                }
              >
                ${price} <span className="text-sm font-normal opacity-80">/ night</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
