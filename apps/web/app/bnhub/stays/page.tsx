import Link from "next/link";
import { StaysSearchClient } from "./stays-search-client";
import { FeaturedListings } from "@/components/bnhub/FeaturedListings";
import { SponsoredListings } from "@/components/bnhub/SponsoredListings";

export default function BNHubStaysPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/bnhub"
            className="text-lg font-semibold tracking-tight text-white"
          >
            BNB Hub
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/bnhub/stays"
              className="text-sm font-medium text-emerald-400"
            >
              Find a stay
            </Link>
            <Link
              href="/bnhub/host/dashboard"
              className="text-sm font-medium text-slate-300 hover:text-white"
            >
              Host dashboard
            </Link>
            <Link
              href="/bnhub/login"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            Short-term rentals
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Search by location, dates, and guests. Verified listings only when you need extra peace of mind.
          </p>
        </div>
      </section>

      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
          <FeaturedListings />
          <SponsoredListings />
          <StaysSearchClient />
        </div>
      </section>
    </main>
  );
}
