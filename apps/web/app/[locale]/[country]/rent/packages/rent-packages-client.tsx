"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Info } from "lucide-react";
import { PLATFORM_NAME } from "@/config/branding";
import {
  PRESTIGE_RENT_DEPARTMENT,
  RENT_PACKAGE_FEATURES,
  RENT_PACKAGE_TIERS,
  type RentPackageTierId,
} from "@/lib/rent/prestige-rent-packages";

const GOLD = "#d4af37";
const LANDLORD_LOGIN = `/auth/login?returnUrl=${encodeURIComponent("/dashboard/landlord")}`;

function formatCad(n: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <td className="border-b border-black/[0.06] px-4 py-3 text-center">
        <Check className="mx-auto h-5 w-5 text-emerald-600" aria-hidden />
      </td>
    );
  }
  if (value === false) {
    return (
      <td className="border-b border-black/[0.06] px-4 py-3 text-center text-lg text-[#c4c4c4]" aria-hidden>
        —
      </td>
    );
  }
  return (
    <td className="border-b border-black/[0.06] px-4 py-3 text-center text-sm font-medium text-[#2d2d2d]">{value}</td>
  );
}

function tierHref(id: RentPackageTierId): string {
  if (id === "free") return LANDLORD_LOGIN;
  return "/support";
}

function tierCta(id: RentPackageTierId): string {
  if (id === "free") return "Choose this package";
  return "Request this package";
}

export function RentPackagesClient() {
  const [kind, setKind] = useState<"residential" | "commercial">("residential");

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#0b0b0b]">
      <div className="border-b border-black/10 bg-[#1a1810] px-4 py-2.5 text-center sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-premium-gold/90">
          {PRESTIGE_RENT_DEPARTMENT.name}
        </p>
      </div>

      {/* Hero — DuProprio layout, Prestige palette */}
      <section className="border-b border-black/10 bg-gradient-to-b from-white to-[#f0ebe3]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              Flexible packages tailored to your rental needs
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#4a4a4a] sm:text-lg">
              Maximize visibility to qualified tenants on {PLATFORM_NAME} — start free, then add signage, featured
              placement, and pro media when you are ready. Short-term stays use{" "}
              <Link href="/pricing/bnhub" className="font-semibold text-premium-gold hover:underline">
                BNHUB host plans
              </Link>
              .
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#rent-packages"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-[#0b0b0b] px-8 text-sm font-bold text-[#0b0b0b] transition hover:bg-black/[0.04]"
              >
                Choose a package
              </a>
              <Link
                href="/rent"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full px-8 text-sm font-bold text-[#0b0b0b] shadow-md transition hover:brightness-105"
                style={{ background: GOLD }}
              >
                Browse Rent Hub
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#e8e4dc] shadow-xl ring-1 ring-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop"
              alt=""
              className="h-full w-full object-cover"
            />
            <div
              className="pointer-events-none absolute -right-8 bottom-0 top-1/4 w-32 rounded-full border-4 border-premium-gold/40 opacity-60"
              aria-hidden
            />
          </div>
        </div>
      </section>

      {/* B2B-style banner — gold accent */}
      <div className="border-b border-premium-gold/20 bg-gradient-to-r from-[#f5edd8] to-[#ebe4d6]">
        <Link
          href="/professionals"
          className="mx-auto flex max-w-4xl items-center justify-center gap-2 px-4 py-4 text-center text-sm font-bold text-[#3d3420] sm:px-6 sm:text-base"
        >
          Builders, developers, agencies &amp; landlords: explore professional tools on {PLATFORM_NAME}
          <span className="text-premium-gold" aria-hidden>
            →
          </span>
        </Link>
      </div>

      <section id="rent-packages" className="scroll-mt-24 border-b border-black/10 bg-white px-4 py-14 sm:px-6 lg:py-18">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Choose your rental package</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-[#5c5c5c]">
            {kind === "residential"
              ? "Residential leases — long-term listings on Rent Hub. Paid tiers are rolling out; request access and we will confirm availability for your area."
              : "Commercial & mixed-use — same ladder; our team confirms compliance and placement rules before billing."}
          </p>

          <div className="mt-10 flex justify-center">
            <div className="inline-flex rounded-full border border-black/10 bg-[#eef2f8] p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setKind("residential")}
                className={`min-h-[44px] rounded-full px-6 py-2 text-sm font-bold transition ${
                  kind === "residential" ? "bg-[#0b0b0b] text-white shadow-md" : "text-[#3d3d3d] hover:bg-white/80"
                }`}
              >
                Residential property
              </button>
              <button
                type="button"
                onClick={() => setKind("commercial")}
                className={`min-h-[44px] rounded-full px-6 py-2 text-sm font-bold transition ${
                  kind === "commercial" ? "bg-[#0b0b0b] text-white shadow-md" : "text-[#3d3d3d] hover:bg-white/80"
                }`}
              >
                Commercial property
              </button>
            </div>
          </div>

          {/* Desktop table */}
          <div className="mt-12 hidden md:block">
            <div className="overflow-x-auto rounded-2xl border border-black/10 shadow-sm">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="w-[26%] border-b border-black/10 bg-[#faf8f5] px-4 py-4" />
                    {RENT_PACKAGE_TIERS.map((t) => (
                      <th
                        key={t.id}
                        className={`relative border-b border-black/10 px-4 py-4 text-center ${
                          t.mostPopular ? "bg-[#f3f6f0]" : "bg-[#faf8f5]"
                        }`}
                      >
                        {t.mostPopular ? (
                          <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#0b0b0b] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-premium-gold">
                            Most popular
                          </span>
                        ) : null}
                        <div className={`flex flex-col items-center gap-1 ${t.mostPopular ? "pt-2" : ""}`}>
                          <span className="font-bold text-[#0b0b0b]">{t.label}</span>
                          <span className="text-xl font-bold text-premium-gold">
                            {t.priceCad <= 0 ? "$0" : formatCad(t.priceCad)}
                          </span>
                          <span className="text-[10px] font-normal uppercase tracking-wide text-[#888]">
                            {t.priceCad <= 0 ? "always" : "representative CAD"}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="border-b border-black/10 bg-white px-4 py-3" />
                    {RENT_PACKAGE_TIERS.map((t) => (
                      <th key={t.id} className={`border-b border-black/10 px-4 py-3 ${t.mostPopular ? "bg-[#f3f6f0]" : "bg-white"}`}>
                        <Link
                          href={tierHref(t.id)}
                          className={`flex min-h-[44px] w-full items-center justify-center rounded-full text-xs font-bold ${
                            t.mostPopular
                              ? "bg-[#0b0b0b] text-white hover:bg-[#2a2a2a]"
                              : "border-2 border-[#0b0b0b] text-[#0b0b0b] hover:bg-black/[0.04]"
                          }`}
                        >
                          {tierCta(t.id)}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RENT_PACKAGE_FEATURES.map((row) => (
                    <tr key={row.key}>
                      <th className="border-b border-black/[0.06] bg-white px-4 py-3.5 text-left">
                        <span className="inline-flex items-center gap-2 font-medium text-[#0b0b0b]">
                          {row.key}
                          {row.footnote ? (
                            <span className="text-[#888]" title="See footnote below">
                              <Info className="h-4 w-4" aria-hidden />
                            </span>
                          ) : null}
                        </span>
                      </th>
                      <FeatureCell value={row.free} />
                      <FeatureCell value={row.sign} />
                      <FeatureCell value={row.showcase} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="mt-10 space-y-6 md:hidden">
            {RENT_PACKAGE_TIERS.map((t) => (
              <div
                key={t.id}
                className={`rounded-2xl border p-5 shadow-sm ${
                  t.mostPopular ? "border-premium-gold/50 bg-[#f3f6f0]" : "border-black/10 bg-white"
                }`}
              >
                {t.mostPopular ? (
                  <span className="inline-block rounded-full bg-[#0b0b0b] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-premium-gold">
                    Most popular
                  </span>
                ) : null}
                <h3 className="mt-2 text-lg font-bold">{t.label}</h3>
                <p className="mt-1 text-2xl font-bold text-premium-gold">{t.priceCad <= 0 ? "$0" : formatCad(t.priceCad)}</p>
                <p className="mt-2 text-sm text-[#5c5c5c]">{t.blurb}</p>
                <Link
                  href={tierHref(t.id)}
                  className={`mt-4 flex min-h-[48px] w-full items-center justify-center rounded-full text-sm font-bold ${
                    t.mostPopular ? "bg-[#0b0b0b] text-white" : "border-2 border-[#0b0b0b] text-[#0b0b0b]"
                  }`}
                >
                  {tierCta(t.id)}
                </Link>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-[#777]">
            * Professional HDR visits are offered where field teams are available — not all regions qualify on day one.
            Representative <strong className="text-[#555]">Sign</strong> and <strong className="text-[#555]">Showcase</strong>{" "}
            fees are shown in CAD; final taxes and eligibility are confirmed before payment when checkout goes live.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4 border-t border-black/10 pt-10">
            <Link
              href="/bnhub/host/listings/new"
              className="inline-flex items-center gap-2 text-sm font-bold text-premium-gold hover:underline"
            >
              Listing nightly stays instead? <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <span className="hidden text-[#ccc] sm:inline" aria-hidden>
              |
            </span>
            <Link href="/pricing/bnhub" className="text-sm font-semibold text-[#5c5c5c] hover:text-premium-gold hover:underline">
              BNHUB host pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
