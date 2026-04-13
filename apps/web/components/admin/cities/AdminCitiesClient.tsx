"use client";

import { useActionState } from "react";
import type { CitySupplyDemandSnapshot } from "@/modules/multi-city/cityMetrics";
import { launchCityAction, refreshCityScoresAction, type CityAdminActionState } from "@/app/admin/cities/actions";

export type CityDashboardRow = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string | null;
  status: string;
  launchDate: string | null;
  listingsEnabled: boolean;
  searchPagesEnabled: boolean;
  growthEngineEnabled: boolean;
  expansionScore: number | null;
  playbookMessaging: string | null;
  playbookPricing: string | null;
  playbookStrategy: string | null;
  metrics: CitySupplyDemandSnapshot;
};

function fmtMoneyCents(cents: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(
    cents / 100
  );
}

function initialLaunchState(): CityAdminActionState {
  return { ok: true };
}

export function AdminCitiesClient({
  rows,
  suggestedNextSlug,
}: {
  rows: CityDashboardRow[];
  suggestedNextSlug: string | null;
}) {
  const [refreshState, refreshAction, refreshPending] = useActionState(refreshCityScoresAction, initialLaunchState());

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-700/80 bg-slate-900/40 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">Priority expansion</p>
          <p className="mt-1 text-sm text-slate-300">
            Suggested next launch:{" "}
            <span className="font-mono text-emerald-400">{suggestedNextSlug ?? "— (no testing markets)"}</span>
          </p>
        </div>
        <form action={refreshAction}>
          <button
            type="submit"
            disabled={refreshPending}
            className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
          >
            {refreshPending ? "Refreshing scores…" : "Recompute opportunity scores"}
          </button>
        </form>
      </div>
      {!refreshState.ok && refreshState.error ? (
        <p className="text-sm text-red-400">{refreshState.error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-slate-700/80">
        <table className="min-w-[960px] w-full text-left text-sm text-slate-200">
          <thead className="border-b border-slate-700 bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Users</th>
              <th className="px-3 py-2">Listings</th>
              <th className="px-3 py-2">Bookings (90d)</th>
              <th className="px-3 py-2">Revenue (90d)</th>
              <th className="px-3 py-2">Buyers ÷ listings</th>
              <th className="px-3 py-2">Bookings ÷ host</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Rollout</th>
              <th className="px-3 py-2">Playbooks</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <CityRow key={r.id} row={r} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs font-medium tracking-[0.2em] text-emerald-400/90">
        LECIPM MULTI-CITY SYSTEM ACTIVE
      </p>
    </div>
  );
}

function CityRow({ row: r }: { row: CityDashboardRow }) {
  const [state, formAction, pending] = useActionState(launchCityAction, initialLaunchState());
  const m = r.metrics;
  const listingsTotal = m.activeListings;
  const canLaunch = r.status === "testing";

  return (
    <tr className="border-b border-slate-800/80 align-top hover:bg-slate-900/50">
      <td className="px-3 py-3">
        <div className="font-medium text-white">{r.name}</div>
        <div className="font-mono text-xs text-slate-500">
          {r.slug} · {r.country}
          {r.region ? ` · ${r.region}` : ""}
        </div>
        {r.launchDate ? <div className="mt-1 text-xs text-slate-500">Launched {r.launchDate}</div> : null}
      </td>
      <td className="px-3 py-3">
        <span
          className={
            r.status === "active"
              ? "rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300"
              : "rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200"
          }
        >
          {r.status}
        </span>
      </td>
      <td className="px-3 py-3 tabular-nums">{m.usersInMarket}</td>
      <td className="px-3 py-3 tabular-nums" title="FSBO + BNHUB published">
        {listingsTotal}
        <span className="block text-xs text-slate-500">
          {m.activeFsboListings} FSBO · {m.publishedBnhubListings} BNH
        </span>
      </td>
      <td className="px-3 py-3 tabular-nums">{m.bookings90d}</td>
      <td className="px-3 py-3 tabular-nums">{fmtMoneyCents(m.revenueCents90d)}</td>
      <td className="px-3 py-3 tabular-nums text-slate-300" title="Leads 90d vs active listings">
        {m.buyerToListingRatio.toFixed(2)}
      </td>
      <td className="px-3 py-3 tabular-nums text-slate-300" title="Confirmed/completed stays, 90d check-in">
        {m.bookingsPerHost.toFixed(2)}
      </td>
      <td className="px-3 py-3 tabular-nums">{r.expansionScore ?? "—"}</td>
      <td className="px-3 py-3 text-xs text-slate-400">
        <div>L: {r.listingsEnabled ? "on" : "off"}</div>
        <div>S: {r.searchPagesEnabled ? "on" : "off"}</div>
        <div>G: {r.growthEngineEnabled ? "on" : "off"}</div>
      </td>
      <td className="px-3 py-3 max-w-[200px] text-xs text-slate-500">
        {r.playbookMessaging ? <p className="line-clamp-2">{r.playbookMessaging}</p> : <span>—</span>}
        {r.playbookPricing ? <p className="mt-1 line-clamp-1 text-slate-600">{r.playbookPricing}</p> : null}
      </td>
      <td className="px-3 py-3">
        {canLaunch ? (
          <form action={formAction}>
            <input type="hidden" name="cityId" value={r.id} />
            <button
              type="submit"
              disabled={pending}
              className="whitespace-nowrap rounded bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {pending ? "…" : "Launch city"}
            </button>
          </form>
        ) : (
          <span className="text-xs text-slate-600">Live</span>
        )}
        {!state.ok && state.error ? <p className="mt-1 max-w-[140px] text-xs text-red-400">{state.error}</p> : null}
      </td>
    </tr>
  );
}
