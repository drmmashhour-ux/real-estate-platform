"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { InvestorMetricsSnapshot, InvestorTimeWindow } from "@/lib/investor/metrics-types";

const BG = "#0b0b0b";
const GOLD = "#D4AF37";

const WINDOWS: { id: InvestorTimeWindow; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "all", label: "All" },
];

function fmtCents(c: number | null | undefined): string {
  if (c == null || Number.isNaN(c)) return "Unavailable";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(c / 100);
}

function Card({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ backgroundColor: "#141414", borderColor: "rgba(212, 175, 55, 0.25)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: GOLD }}>
        {title}
      </p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}

export function OpsInvestorDashboardClient({ initial }: { initial: InvestorMetricsSnapshot }) {
  const router = useRouter();
  const sp = useSearchParams();
  const w = (sp.get("window") as InvestorTimeWindow | null) ?? "30d";

  function setWindow(next: InvestorTimeWindow) {
    const p = new URLSearchParams(sp.toString());
    p.set("window", next);
    router.push(`?${p.toString()}`);
  }

  async function exportJson() {
    const res = await fetch(`/api/admin/ops-investor-metrics?window=${encodeURIComponent(w)}`, {
      credentials: "same-origin",
    });
    if (!res.ok) return;
    const j = await res.json();
    const blob = new Blob([JSON.stringify(j, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `lecipm-ops-metrics-${w}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const m = initial;

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6" style={{ backgroundColor: BG }}>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
              Internal — LECIPM Manager
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Operations & investor metrics</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Database counts only. No projected traction. Generated {new Date(m.generatedAt).toISOString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {WINDOWS.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setWindow(x.id)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition"
                style={{
                  backgroundColor: w === x.id ? GOLD : "transparent",
                  color: w === x.id ? BG : GOLD,
                  border: `1px solid ${GOLD}`,
                }}
              >
                {x.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => exportJson()}
              className="rounded-lg px-3 py-1.5 text-sm text-white"
              style={{ border: "1px solid rgba(212,175,55,0.4)" }}
            >
              Export JSON
            </button>
          </div>
        </header>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-white">Overview</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Published listings" value={m.marketplace.publishedListings} />
            <Card title="Bookings (window)" value={m.bookings.createdInRange} hint={m.range.label} />
            <Card
              title="Confirmed (window)"
              value={m.bookings.confirmedInRange}
              hint="Status CONFIRMED, created in range"
            />
            <Card
              title="GMV proxy"
              value={fmtCents(m.revenue.bookingTotalCentsGmvProxyInRange)}
              hint="Sum of booking.totalCents, created in range"
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-white">Marketplace health</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Draft" value={m.marketplace.draftListings} />
            <Card title="Pending review" value={m.marketplace.pendingReviewListings} />
            <Card title="Incomplete (draft + review)" value={m.marketplace.incompleteListings} />
            <Card title="Hosts (distinct)" value={m.marketplace.hostsWithListings} />
            <Card title="Autopilot enabled (hosts)" value={m.marketplace.hostsWithAutopilotEnabled} />
            <Card title="Active promotions (listings)" value={m.marketplace.listingsWithActivePromotion} />
            <Card title="Pending bookings now" value={m.bookings.pendingNow} hint="Queue snapshot" />
            <Card title="Total bookings (all time)" value={m.bookings.totalBookingsAllTime} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-white">AI operations</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Recommendations (window)" value={m.ai.managerRecommendationsCreatedInRange} />
            <Card title="Approvals pending" value={m.ai.managerApprovalsPendingNow} />
            <Card title="Actions executed" value={m.ai.managerActionsExecutedInRange} />
            <Card title="Overrides" value={m.ai.managerOverrideEventsInRange} />
            <Card title="Health events" value={m.ai.managerHealthEventsInRange} />
            <Card title="Suppressions" value={m.ai.managerActionLogsSuppressedInRange} />
            <Card title="Agent runs OK" value={m.ai.managerAgentRunsCompletedInRange} />
            <Card title="Agent runs failed" value={m.ai.managerAgentRunsFailedInRange} />
          </div>
          <div
            className="mt-4 rounded-xl border p-4"
            style={{ borderColor: "rgba(212,175,55,0.25)", backgroundColor: "#141414" }}
          >
            <p className="text-xs font-semibold uppercase" style={{ color: GOLD }}>
              Top action keys (window)
            </p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-300">
              {m.ai.topActionKeysInRange.length === 0 ? (
                <li className="text-neutral-500">No rows</li>
              ) : (
                m.ai.topActionKeysInRange.map((r) => (
                  <li key={r.actionKey} className="flex justify-between gap-4">
                    <span className="font-mono text-xs text-neutral-400">{r.actionKey}</span>
                    <span style={{ color: GOLD }}>{r.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-white">Revenue & payouts</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              title="Stripe payment fees (window)"
              value={fmtCents(m.revenue.stripePaymentPlatformFeeCentsInRange)}
              hint="Payment.platformFeeCents, COMPLETED"
            />
            <Card
              title="BNHUB payout fee sum (window)"
              value={fmtCents(m.revenue.bnhubPayoutPlatformFeeCentsInRange)}
              hint="BnhubHostPayoutRecord.platformFeeCents"
            />
            <Card title="BNHUB payouts paid (window)" value={m.revenue.bnhubPayoutsPaidCountInRange} />
            <Card
              title="Paid net (window)"
              value={fmtCents(m.revenue.bnhubPayoutsPaidNetCentsInRange)}
              hint="releasedAt in range (or all PAID if all-time)"
            />
            <Card title="Pending / in-flight payouts" value={m.revenue.bnhubPayoutsPendingOrInFlightCount} />
            <Card
              title="Pending net (open)"
              value={fmtCents(m.revenue.bnhubPayoutsPendingOrInFlightNetCents)}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-white">Growth</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card title="New STR listings (window)" value={m.growth.newStrListingsCreatedInRange} />
          </div>
          <p className="mt-2 text-xs text-neutral-600">
            Omitted metrics: {m.unavailable.join(", ")} — not modeled as a single DB truth here.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "rgba(212,175,55,0.25)", backgroundColor: "#141414" }}
          >
            <p className="text-xs font-semibold uppercase" style={{ color: GOLD }}>
              STR listings by country
            </p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-300">
              {m.geography.strListingsByCountry.map((r) => (
                <li key={r.country} className="flex justify-between">
                  <span>{r.country}</span>
                  <span style={{ color: GOLD }}>{r.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "rgba(212,175,55,0.25)", backgroundColor: "#141414" }}
          >
            <p className="text-xs font-semibold uppercase" style={{ color: GOLD }}>
              Platform
            </p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-300">
              <li>Active market: {m.platform.activeMarketCode ?? "Unavailable"}</li>
              <li>Syria mode: {m.platform.syriaModeEnabled == null ? "Unavailable" : String(m.platform.syriaModeEnabled)}</li>
              <li>
                Online payments:{" "}
                {m.platform.onlinePaymentsEnabled == null ? "Unavailable" : String(m.platform.onlinePaymentsEnabled)}
              </li>
            </ul>
            <p className="mt-4 text-xs font-semibold uppercase" style={{ color: GOLD }}>
              User UI locale (set)
            </p>
            <ul className="mt-2 space-y-1 text-sm text-neutral-300">
              {m.users.preferredUiLocaleBuckets.map((r) => (
                <li key={r.locale} className="flex justify-between">
                  <span>{r.locale}</span>
                  <span style={{ color: GOLD }}>{r.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
