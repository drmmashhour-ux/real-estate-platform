import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, MessageSquare, Search, TrendingUp, Users } from "lucide-react";
import { PUBLIC_MAP_SEARCH_URL } from "@/lib/search/public-map-search-urls";

/** Unsplash — coastal suite (guest discovery) & villa exterior (host listing). */
const IMG_GUEST = "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80";
const IMG_HOST = "https://images.unsplash.com/photo-1613490493576-495fefd28f73?auto=format&fit=crop&w=800&q=80";

/**
 * Static UI “simulations” so visitors see guest search vs host operations at a glance.
 */
export function BnhubLandingJourneySimulations() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-premium-gold/25 bg-[#0a0a0a] p-4 shadow-[0_0_60px_rgba(212,175,55,0.08)] md:p-5">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-premium-gold/5 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-premium-gold/5 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-premium-gold/80">Two journeys</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-premium-gold sm:text-3xl">
          Guests discover. Hosts publish.
        </h2>
        <p className="mt-2 text-sm text-neutral-400">
          Illustrative previews — your real flows live in search and the host dashboard.
        </p>
      </div>

      <div className="relative mt-8 grid gap-4 md:mt-10 lg:grid-cols-2">
        {/* Guest simulation */}
        <article className="flex flex-col rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-sm md:p-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-premium-gold/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-premium-gold">
              Guest
            </span>
            <h3 className="text-lg font-semibold text-white">Searching a stay</h3>
          </div>
          <p className="mt-1 text-sm text-neutral-400">Coastal escape or city weekend — map, dates, and verified hosts.</p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-red-400" aria-hidden />
              <div className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
              <div className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
              <span className="ml-2 truncate text-[10px] text-slate-500">bnhub · Find a stay</span>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-800">
                  <MapPin className="h-3 w-3" aria-hidden />
                  Montréal
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-800">
                  <Calendar className="h-3 w-3" aria-hidden />
                  Apr 12 – Apr 15
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-800">
                  <Users className="h-3 w-3" aria-hidden />2 guests
                </span>
              </div>
              <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                  <Image src={IMG_GUEST} alt="" fill className="object-cover" sizes="96px" />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="truncate text-sm font-bold text-slate-900">Bright suite · near Old Port</p>
                  <p className="text-xs text-slate-500">Entire place · 4.9 ★ · Free cancellation</p>
                  <p className="text-sm font-bold text-slate-900">
                    $189 <span className="text-xs font-normal text-slate-500">/ night</span>
                  </p>
                </div>
              </div>
              <div
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white"
                aria-hidden
              >
                <Search className="h-3.5 w-3.5" />
                Show 240+ stays on map
              </div>
            </div>
          </div>

          <Link
            href={PUBLIC_MAP_SEARCH_URL.bnhubStays}
            className="mt-4 text-sm font-semibold text-premium-gold hover:underline"
          >
            Try real search →
          </Link>
        </article>

        {/* Host simulation */}
        <article className="flex flex-col rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-sm md:p-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-premium-gold/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-premium-gold">
              Host
            </span>
            <h3 className="text-lg font-semibold text-white">Managing your listing</h3>
          </div>
          <p className="mt-1 text-sm text-neutral-400">Calendar, messages, and payouts in one Prestige-connected hub.</p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-xs font-semibold text-premium-gold">Host dashboard</span>
              <span className="text-[10px] text-neutral-500">Today</span>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10">
                <Image src={IMG_HOST} alt="" fill className="object-cover" sizes="(min-width:1024px) 200px, 50vw" />
                <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                  Listed · Villa
                </span>
              </div>
              <div className="flex flex-col justify-center space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-neutral-400">This month</span>
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                    $3,240
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <span className="flex items-center gap-1.5 text-neutral-300">
                    <MessageSquare className="h-3.5 w-3.5 text-premium-gold" aria-hidden />
                    Inquiries
                  </span>
                  <span className="font-semibold text-white">3 new</span>
                </div>
                <div className="rounded-lg border border-premium-gold/30 bg-premium-gold/10 px-3 py-2 text-center text-xs font-semibold text-premium-gold">
                  Next: sync calendar &amp; publish
                </div>
              </div>
            </div>
          </div>

          <Link href="/bnhub/host/dashboard" className="mt-4 text-sm font-semibold text-premium-gold hover:underline">
            Open host dashboard →
          </Link>
        </article>
      </div>
    </section>
  );
}
