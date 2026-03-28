"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/tracking";
import type { DailyDealFeed as FeedDto } from "@/src/modules/daily-deal-feed/domain/dailyDealFeed.types";
import { DailyDealHero } from "@/src/modules/daily-deal-feed/ui/DailyDealHero";
import { DailyDealSection } from "@/src/modules/daily-deal-feed/ui/DailyDealSection";
import { FeedEmptyState } from "@/src/modules/daily-deal-feed/ui/FeedEmptyState";

type Props = {
  title?: string;
  initialFeed?: FeedDto | null;
};

export function DailyDealFeed({ title = "Top Deals for You Today", initialFeed = null }: Props) {
  const [feed, setFeed] = useState<FeedDto | null>(initialFeed);
  const [loading, setLoading] = useState(!initialFeed);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    track("daily_deal_feed_viewed");
  }, []);

  useEffect(() => {
    if (initialFeed) return;
    let active = true;
    (async () => {
      const res = await fetch("/api/daily-deals", { cache: "no-store" }).catch(() => null);
      const data = res?.ok ? await res.json().catch(() => null) : null;
      if (!active) return;
      setFeed(data?.feed ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [initialFeed]);

  const refresh = async () => {
    setRefreshing(true);
    track("daily_deal_refresh_triggered");
    const res = await fetch("/api/daily-deals/refresh", { method: "POST" }).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    setFeed(data?.feed ?? null);
    setRefreshing(false);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b0b0c] p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {feed?.retentionHooks?.length ? (
            <p className="mt-1 text-xs text-slate-500">{feed.retentionHooks.join(" · ")}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="rounded-lg border border-premium-gold/40 px-3 py-2 text-xs font-semibold text-premium-gold hover:bg-premium-gold/10 disabled:opacity-60"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mt-4">
        {loading ? <p className="text-sm text-slate-400">Loading your deals...</p> : null}
        {!loading && !feed?.itemCount ? <FeedEmptyState /> : null}
        {!loading && feed?.itemCount ? (
          <>
            <DailyDealHero item={feed.hero} />
            {feed.sections.map((section) => (
              <DailyDealSection key={section.bucket} section={section} />
            ))}
          </>
        ) : null}
      </div>
    </section>
  );
}
