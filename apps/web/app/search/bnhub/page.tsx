import Link from "next/link";
import { BnhubSearchClient } from "./bnhub-search-client";
import { Suspense } from "react";

function BnhubSearchLoadingFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-10 max-w-md animate-pulse rounded-lg bg-slate-200" aria-hidden />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm"
          >
            <div className="aspect-[4/3] animate-pulse bg-slate-200" />
            <div className="space-y-2 p-4">
              <div className="h-4 max-w-[85%] animate-pulse rounded bg-slate-200" />
              <div className="h-3 max-w-[50%] animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">Loading properties…</p>
    </div>
  );
}

export default function BNHubSearchPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/dashboard/bnhub"
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            BNHub
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/search/bnhub"
              className="text-sm font-medium text-rose-500"
            >
              Find a stay
            </Link>
            <Link
              href="/bnhub/guest-protection"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Guest protection
            </Link>
            <Link
              href="/dashboard/bnhub/host"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Host dashboard
            </Link>
            <Link
              href="/bnhub/login"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <Suspense fallback={<BnhubSearchLoadingFallback />}>
        <BnhubSearchClient />
      </Suspense>
    </main>
  );
}
