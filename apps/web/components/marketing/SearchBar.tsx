"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { getTrackingSessionId, track, TrackingEvent } from "@/lib/tracking";

export function SearchBar() {
  const [q, setQ] = useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = q.trim();
    const sid = getTrackingSessionId();
    track(TrackingEvent.SEARCH, {
      meta: {
        surface: "landing_v1_search_bar",
        location: t || null,
        growthDedupeKey: sid
          ? `search:landing_v1:${t || "all"}:${sid}:${Date.now()}`
          : `search:landing_v1:${Date.now()}`,
      },
      path: typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/",
    });
    const href = t ? `/search?location=${encodeURIComponent(t)}` : "/search";
    router.push(href);
  }

  return (
    <div className="border-b border-white/5 bg-landing-black py-6 sm:py-8">
      <Container>
        <form onSubmit={submit} className="mx-auto max-w-3xl">
          <label htmlFor="landing-search" className="sr-only">
            Search by city, address, or listing ID
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              id="landing-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by city, address, or listing ID"
              className="min-h-[52px] flex-1 rounded-2xl border border-white/15 bg-landing-dark px-4 text-base text-white placeholder:text-white/35 focus:border-premium-gold/50 focus:outline-none focus:ring-1 focus:ring-premium-gold/30"
              autoComplete="off"
            />
            <button
              type="submit"
              className="min-h-[52px] shrink-0 rounded-2xl bg-premium-gold px-8 text-sm font-semibold text-premium-bg transition hover:bg-premium-gold-hover sm:px-10"
            >
              Search
            </button>
          </div>
        </form>
      </Container>
    </div>
  );
}
