import Link from "next/link";
import { BNHubSearchClient } from "./bnhub-search-client";

export default function BNHubPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            BNHub
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Short-term rentals
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            A verified short-term rental network integrated with the
            professional real-estate ecosystem. Search by city and dates.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/bnhub/login"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Sign in to book
            </Link>
            <Link
              href="/bnhub/host/dashboard"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Host dashboard →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <BNHubSearchClient />
        </div>
      </section>
    </main>
  );
}
