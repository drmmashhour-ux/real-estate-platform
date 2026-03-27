import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import {
  DOMINATION_CITIES,
  type DominationCityKey,
} from "@/lib/growth/domination-cities";

function photoFirst(photos: unknown): string | null {
  if (!Array.isArray(photos)) return null;
  const s = photos.find((p): p is string => typeof p === "string");
  return s ?? null;
}

export function dominationCityMetadata(key: DominationCityKey): Metadata {
  const c = DOMINATION_CITIES[key];
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    openGraph: { title: c.metaTitle, description: c.metaDescription },
  };
}

function lecipmCityExplorerSlug(key: DominationCityKey): string | null {
  if (key === "montreal" || key === "laval") return key;
  if (key === "quebec-city") return "quebec";
  return null;
}

export async function BnhubDominationCityPage({ cityKey }: { cityKey: DominationCityKey }) {
  const cfg = DOMINATION_CITIES[cityKey];
  const explorerSlug = lecipmCityExplorerSlug(cityKey);
  const listings = await prisma.shortTermListing.findMany({
    where: cfg.listingWhere,
    orderBy: { updatedAt: "desc" },
    take: 12,
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      nightPriceCents: true,
      photos: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/bnhub" className="text-lg font-semibold tracking-tight text-white">
            BNHub
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/bnhub/stays" className="text-emerald-400">
              Find a stay
            </Link>
            <Link href="/host/apply" className="text-slate-300 hover:text-white">
              List your property
            </Link>
            <Link href="/early-access" className="text-slate-500 hover:text-slate-300">
              Early access
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-800 bg-gradient-to-b from-emerald-950/50 to-slate-950 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">BNHub · {cfg.country}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Short-term stays in {cfg.displayName}
          </h1>
          <p className="mt-4 max-w-2xl text-slate-400">
            Verified listings, clear nightly pricing, and secure booking. We are building the densest supply in{" "}
            {cfg.displayName} first — hosts get early visibility; guests get real choice.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/bnhub/stays?city=${encodeURIComponent(cfg.displayName)}`}
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
            >
              Search {cfg.displayName}
            </Link>
            <Link
              href="/host/apply"
              className="rounded-xl border border-slate-600 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-white hover:border-slate-500"
            >
              Become a host
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-xs text-slate-500">
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span> Identity & listing checks
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span> Secure payments
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span> Human support for early markets
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-lg font-semibold text-white">Stays in {cfg.displayName}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {listings.length === 0
            ? "Listings are rolling out — request early access or list your space to anchor supply."
            : "Featured inventory in your market (updates as hosts go live)."}
        </p>

        {listings.length > 0 ? (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => {
              const href = `/bnhub/${l.listingCode || l.id}`;
              const img = photoFirst(l.photos);
              return (
                <li key={l.id}>
                  <Link
                    href={href}
                    className="group block overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 transition hover:border-emerald-500/30"
                  >
                    <div className="aspect-[16/10] bg-slate-800">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                        />
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-1 font-medium text-white group-hover:text-emerald-300">{l.title}</p>
                      <p className="text-xs text-slate-500">{l.city}</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-300">
                        ${(l.nightPriceCents / 100).toFixed(0)} / night
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
            <Link href="/host/apply" className="font-medium text-emerald-400 hover:text-emerald-300">
              List your property
            </Link>{" "}
            to appear here first.
          </div>
        )}

        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h3 className="text-sm font-semibold text-white">Also on LECIPM</h3>
          <p className="mt-2 text-sm text-slate-500">
            {explorerSlug ? (
              <>
                Explore broader real estate insights —{" "}
                <Link href={`/city/${explorerSlug}`} className="text-emerald-400 hover:text-emerald-300">
                  {cfg.displayName} market page
                </Link>
                .
              </>
            ) : (
              <>National expansion — city investment pages rolling out alongside BNHub supply.</>
            )}
          </p>
        </div>
      </section>
    </main>
  );
}
