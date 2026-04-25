"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Camera,
  Gift,
  Home,
  LineChart,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import { GrowthInsights } from "@/components/bnhub/GrowthInsights";
import type {
  CompetitorSnapshot,
  GrowthAlert,
  GrowthInsight,
  HostGrowthLevel,
  MonthlyBookingMetric,
} from "@/lib/bnhub/host-growth-engine";
import { hostGrowthLevelCopy } from "@/lib/bnhub/host-growth-engine";

export type ListingInsightGroup = {
  listingId: string;
  title: string;
  listingCode: string;
  insights: GrowthInsight[];
};

function formatCad(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

function levelBadgeClass(level: HostGrowthLevel) {
  if (level === "top_host") return "border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#D4AF37]";
  if (level === "active_host") return "border-sky-400/40 bg-sky-500/10 text-sky-200";
  return "border-white/20 bg-white/5 text-white/80";
}

export function BnhubHostGrowthClient({
  listingInsights,
  alerts,
  hostLevel,
  monthly,
  occupancyEstimatePct,
  revenueTrend,
  competitors,
  yourNightCents,
  marketMedianNightCents,
  monthOverMonthBookingsDelta,
  daysSinceListingUpdate,
  dashboardHref,
  insightsHref,
  pricingHref,
}: {
  listingInsights: ListingInsightGroup[];
  alerts: GrowthAlert[];
  hostLevel: HostGrowthLevel;
  monthly: MonthlyBookingMetric[];
  occupancyEstimatePct: number;
  revenueTrend: "up" | "flat" | "down";
  competitors: CompetitorSnapshot[];
  yourNightCents: number | null;
  marketMedianNightCents: number | null;
  monthOverMonthBookingsDelta: number;
  daysSinceListingUpdate: number | null;
  dashboardHref: string;
  insightsHref: string;
  pricingHref: string;
}) {
  const level = hostGrowthLevelCopy(hostLevel);
  const maxBookings = useMemo(() => Math.max(1, ...monthly.map((m) => m.bookings)), [monthly]);
  const totalBookingsWindow = useMemo(() => monthly.reduce((s, m) => s + m.bookings, 0), [monthly]);
  const totalRevenueWindow = useMemo(() => monthly.reduce((s, m) => s + m.revenueCents, 0), [monthly]);

  const [promo, setPromo] = useState({ discount: false, seasonal: false, lastMinute: false });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6 sm:py-14">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]/85">BNHub host</p>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${levelBadgeClass(hostLevel)}`}>
              {level.label}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Growth center</h1>
          <p className="max-w-2xl text-sm text-white/60">
            Earnings, occupancy signals, and clear next steps — suggestions only; nothing changes on your listing until you
            act.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={dashboardHref} className="text-[#D4AF37] hover:underline">
              ← Host dashboard
            </Link>
            <Link href={insightsHref} className="text-white/45 hover:text-[#D4AF37]">
              Detailed insights
            </Link>
          </div>
          <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/5 px-4 py-3 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">Level benefits</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-white/75">
              {level.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </header>

        {alerts.length > 0 ? (
          <section className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5 sm:p-6" aria-label="Alerts">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Bell className="h-5 w-5" aria-hidden />
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {alerts.map((a) => (
                <li key={a.id} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                  <p className="text-sm font-medium text-white">{a.title}</p>
                  <p className="mt-1 text-sm text-white/65">{a.body}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5">
            <div className="flex items-center gap-2 text-white/50">
              <Home className="h-4 w-4" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wider">Occupancy (est.)</span>
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-white">{occupancyEstimatePct}%</p>
            <p className="mt-1 text-xs text-white/45">Modeled from your reviews and completed stays — not a guarantee.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5">
            <div className="flex items-center gap-2 text-white/50">
              <LineChart className="h-4 w-4" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wider">Revenue trend</span>
            </div>
            <p className="mt-3 text-3xl font-semibold capitalize text-[#D4AF37]">{revenueTrend}</p>
            <p className="mt-1 text-xs text-white/45">Based on last 6 months of booking totals on file.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5">
            <div className="flex items-center gap-2 text-white/50">
              <BarChart3 className="h-4 w-4" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wider">Bookings / month</span>
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-white">{totalBookingsWindow}</p>
            <p className="mt-1 text-xs text-white/45">
              {monthOverMonthBookingsDelta >= 0 ? "+" : ""}
              {monthOverMonthBookingsDelta} vs prior month · {formatCad(totalRevenueWindow)} recorded revenue (window)
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Users className="h-5 w-5 text-[#D4AF37]" aria-hidden />
            Bookings per month
          </h2>
          <div className="mt-6 flex h-40 items-end gap-2 sm:gap-3">
            {monthly.map((m) => (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-[#D4AF37]/25 to-[#D4AF37]/70 sm:max-w-none"
                  style={{ height: `${Math.max(8, (m.bookings / maxBookings) * 120)}px` }}
                  title={`${m.label}: ${m.bookings} bookings`}
                />
                <span className="text-center text-[10px] text-white/45 sm:text-xs">{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Sparkles className="h-5 w-5 text-[#D4AF37]" aria-hidden />
            Growth insights
          </h2>
          <p className="mt-1 text-sm text-white/50">Tailored from your listing signals and local price context.</p>
          <div className="mt-8 space-y-10">
            {listingInsights.length === 0 ? (
              <p className="text-sm text-white/50">Publish a stay to unlock growth insights.</p>
            ) : (
              listingInsights.map((group) => (
                <div key={group.listingId}>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">{group.title}</h3>
                      <p className="font-mono text-xs text-white/40">{group.listingCode}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ActionChip href={`/bnhub/host/listings/${group.listingId}/edit`} icon={<Tag className="h-4 w-4" />}>
                        Adjust price
                      </ActionChip>
                      <ActionChip
                        href={`/bnhub/host/listings/${group.listingId}/edit`}
                        icon={<Sparkles className="h-4 w-4" />}
                      >
                        Update description
                      </ActionChip>
                      <ActionChip
                        href={`/bnhub/host/listings/${group.listingId}/edit`}
                        icon={<Home className="h-4 w-4" />}
                      >
                        Add amenities
                      </ActionChip>
                    </div>
                  </div>
                  <GrowthInsights insights={group.insights} className="mt-4" />
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white">Similar listings</h2>
            <p className="mt-1 text-sm text-white/50">Published stays in your area (snapshot — not real-time comps).</p>
            {competitors.length === 0 ? (
              <p className="mt-4 text-sm text-white/45">Add a city to your listing to see nearby benchmarks.</p>
            ) : (
              <ul className="mt-4 divide-y divide-white/10">
                {competitors.map((c) => (
                  <li key={c.listingId} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span className="max-w-[200px] truncate text-white/85">{c.title}</span>
                    <span className="tabular-nums text-[#D4AF37]">{formatCad(c.nightPriceCents)}</span>
                    <span className="text-xs text-white/45">
                      {c.rating != null ? `${c.rating.toFixed(1)} ★` : "New"} · {c.reviewCount} reviews
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {yourNightCents != null && marketMedianNightCents != null ? (
              <p className="mt-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/70">
                Your nightly: <strong className="text-white">{formatCad(yourNightCents)}</strong> · Area median:{" "}
                <strong className="text-white">{formatCad(marketMedianNightCents)}</strong>
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Gift className="h-5 w-5 text-[#D4AF37]" aria-hidden />
              Promotion tools
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Plan discounts and seasonal pushes here — apply for real in your pricing &amp; calendar tools.
            </p>
            <div className="mt-4 space-y-3">
              <PromoRow
                label="Limited-time discount"
                hint="Good for filling gaps Tue–Thu."
                checked={promo.discount}
                onChange={(v) => setPromo((p) => ({ ...p, discount: v }))}
              />
              <PromoRow
                label="Seasonal offer"
                hint="Holiday or event window — pair with refreshed photos."
                checked={promo.seasonal}
                onChange={(v) => setPromo((p) => ({ ...p, seasonal: v }))}
              />
              <PromoRow
                label="Last-minute deal"
                hint="48h window — protects occupancy without training guests to wait."
                checked={promo.lastMinute}
                onChange={(v) => setPromo((p) => ({ ...p, lastMinute: v }))}
              />
            </div>
            <Link
              href={pricingHref}
              className="bnhub-btn bnhub-btn--secondary mt-6 flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold"
            >
              Open pricing &amp; promotions
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 to-transparent p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Camera className="h-5 w-5 text-[#D4AF37]" aria-hidden />
            Stay active — retention
          </h2>
          <p className="mt-2 text-sm text-white/70">
            {daysSinceListingUpdate != null
              ? `Last listing update was ${daysSinceListingUpdate} day${daysSinceListingUpdate === 1 ? "" : "s"} ago.`
              : "Publish a listing to track refresh reminders."}{" "}
            Hosts who update seasonally see better repeat views.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li className="flex gap-2">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
              Reply to guest messages within an hour when possible.
            </li>
            <li className="flex gap-2">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
              Rotate your lead photo quarterly — daylight &gt; flash.
            </li>
            <li className="flex gap-2">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
              Audit amenities after every 5 stays — guests notice accuracy.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function ActionChip({ href, children, icon }: { href: string; children: ReactNode; icon: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs font-medium text-white/90 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
    >
      <span className="text-[#D4AF37]" aria-hidden>
        {icon}
      </span>
      {children}
    </Link>
  );
}

function PromoRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-[52px] cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#D4AF37]/35">
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 rounded border-white/25 bg-black accent-[#D4AF37]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="mt-0.5 block text-xs text-white/45">{hint}</span>
      </span>
    </label>
  );
}
