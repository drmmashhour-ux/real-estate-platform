"use client";

import { useMemo, useState } from "react";
import {
  ALLOCATION_CATEGORIES,
  ALLOCATION_CATEGORY_LABELS,
  type AllocationCategory,
  type CapitalProfile,
  type TrackedInvestment,
  type WealthRiskProfile,
} from "@/modules/wealth/capital.types";
import {
  computeAllocationTracking,
  suggestAllocation,
  suggestRedeployment,
  summarizeVentures,
  UNASSIGNED_VENTURE,
  ventureLabel,
} from "@/modules/wealth/allocation.engine";

function pct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function formatMoney(n: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

const RISKS: WealthRiskProfile[] = ["conservative", "balanced", "aggressive"];

export function WealthDashboardClient() {
  const [profile, setProfile] = useState<CapitalProfile>({
    currency: "USD",
    totalCapital: 25_000_000,
    liquidCapital: 8_000_000,
    allocatedCapital: 12_000_000,
    riskProfile: "balanced",
    notes: "",
  });

  const [investments, setInvestments] = useState<TrackedInvestment[]>([
    {
      id: "1",
      ventureName: "StudioCo",
      label: "Example: follow-on fund interest",
      category: "startups",
      amountCommitted: 3_000_000,
      illustrativeReturnPct: 0,
      asOf: new Date().toISOString().slice(0, 10),
    },
    {
      id: "2",
      ventureName: "PropCo Alpha",
      label: "Example: income property",
      category: "real_estate",
      amountCommitted: 5_000_000,
      illustrativeReturnPct: 4.2,
      asOf: new Date().toISOString().slice(0, 10),
    },
    {
      id: "3",
      ventureName: "PropCo Alpha",
      label: "Example: second property (same venture)",
      category: "real_estate",
      amountCommitted: 2_000_000,
      illustrativeReturnPct: 5.0,
      asOf: new Date().toISOString().slice(0, 10),
    },
    {
      id: "4",
      label: "Example: indexed core sleeve (unassigned venture)",
      category: "public_markets",
      amountCommitted: 4_000_000,
      illustrativeReturnPct: 7.1,
      asOf: new Date().toISOString().slice(0, 10),
    },
  ]);

  const [ventureFilter, setVentureFilter] = useState<string | null>(null);

  const suggestion = useMemo(() => suggestAllocation(profile), [profile]);
  const tracking = useMemo(() => computeAllocationTracking(profile, investments), [profile, investments]);
  const redeploy = useMemo(() => suggestRedeployment(profile, investments), [profile, investments]);

  const illustrativePerf = useMemo(() => {
    let w = 0;
    let num = 0;
    for (const i of investments) {
      if (i.illustrativeReturnPct == null) continue;
      w += i.amountCommitted;
      num += i.amountCommitted * i.illustrativeReturnPct;
    }
    if (w <= 0) return null;
    return num / w;
  }, [investments]);

  const addRow = () => {
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `inv-${Date.now()}`;
    setInvestments((prev) => [
      ...prev,
      {
        id,
        label: "New position",
        category: "cash_reserve",
        amountCommitted: 0,
        illustrativeReturnPct: undefined,
        asOf: new Date().toISOString().slice(0, 10),
      },
    ]);
  };

  const updateInv = (id: string, patch: Partial<TrackedInvestment>) => {
    setInvestments((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeInv = (id: string) => setInvestments((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 text-zinc-100">
      <header className="space-y-3 border-b border-[#D4AF37]/25 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Post-exit — educational</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Capital overview & allocation</h1>
        <div className="rounded-lg border border-[#D4AF37]/30 bg-[#1a1508] px-4 py-3 text-sm text-[#f5e6c8]">
          <strong className="text-[#D4AF37]">No guarantees.</strong> This workspace is structured for learning and
          planning only — not investment advice, not performance promises, not tax or legal guidance.
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 lg:col-span-2">
          <h2 className="text-lg font-medium text-[#D4AF37]">Capital profile (customizable)</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-zinc-500">
              Currency
              <input
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={profile.currency}
                onChange={(e) => setProfile((p) => ({ ...p, currency: e.target.value.toUpperCase().slice(0, 3) }))}
              />
            </label>
            <label className="text-xs text-zinc-500">
              Risk profile
              <select
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={profile.riskProfile}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, riskProfile: e.target.value as WealthRiskProfile }))
                }
              >
                {RISKS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-zinc-500">
              Total capital
              <input
                type="number"
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={profile.totalCapital}
                onChange={(e) => setProfile((p) => ({ ...p, totalCapital: Math.max(0, Number(e.target.value)) }))}
              />
            </label>
            <label className="text-xs text-zinc-500">
              Liquid capital
              <input
                type="number"
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={profile.liquidCapital}
                onChange={(e) => setProfile((p) => ({ ...p, liquidCapital: Math.max(0, Number(e.target.value)) }))}
              />
            </label>
            <label className="text-xs text-zinc-500 sm:col-span-2">
              Allocated capital (summary)
              <input
                type="number"
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={profile.allocatedCapital}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, allocatedCapital: Math.max(0, Number(e.target.value)) }))
                }
              />
            </label>
            <label className="text-xs text-zinc-500 sm:col-span-2">
              Notes
              <textarea
                className="mt-1 min-h-[64px] w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                value={profile.notes ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, notes: e.target.value }))}
              />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="text-sm font-semibold text-white">Illustrative performance</h3>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-[#D4AF37]">
              {illustrativePerf == null ? "—" : `${illustrativePerf.toFixed(2)}%`}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Amount-weighted average of user-entered illustrative returns — not audited, not predictive.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-sm text-zinc-400">
            <p>
              Tracked vs total:{" "}
              <span className="text-white">{formatMoney(tracking.totalTracked, profile.currency)}</span> /{" "}
              <span className="text-white">{formatMoney(profile.totalCapital, profile.currency)}</span>
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Unallocated liquid (rough): {formatMoney(tracking.unallocatedLiquid, profile.currency)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-[#D4AF37]">Suggested allocation (by risk band)</h2>
        <p className="mt-1 text-xs text-zinc-500">Adjust your risk profile above — weights are illustrative defaults.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {ALLOCATION_CATEGORIES.map((c) => (
            <div key={c}>
              <div className="flex justify-between text-sm text-zinc-300">
                <span>{ALLOCATION_CATEGORY_LABELS[c]}</span>
                <span className="tabular-nums text-[#D4AF37]">{pct(suggestion.targetWeights[c])}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[#D4AF37]/70"
                  style={{ width: `${Math.min(100, suggestion.targetWeights[c] * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-zinc-500">
                Current (tracked): {pct(tracking.byCategory[c].pctOfTotal)}
              </p>
            </div>
          ))}
        </div>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-zinc-400">
          {suggestion.themes.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-[#D4AF37]">Ventures (roll-up)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Group positions under one label to review concentration per venture. Empty venture = {UNASSIGNED_VENTURE}.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ventureRollups.map((v) => (
            <div
              key={v.ventureName}
              className="rounded-lg border border-zinc-800 bg-black/25 px-4 py-3 text-sm"
            >
              <p className="font-medium text-white">{v.ventureName}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {v.positionCount} position{v.positionCount === 1 ? "" : "s"} ·{" "}
                {formatMoney(v.totalCommitted, profile.currency)}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                Illustr. return (weighted):{" "}
                <span className="tabular-nums text-[#D4AF37]">
                  {v.illustrativeReturnPct == null ? "—" : `${v.illustrativeReturnPct.toFixed(2)}%`}
                </span>
              </p>
              <ul className="mt-2 space-y-0.5 text-[11px] text-zinc-500">
                {ALLOCATION_CATEGORIES.map((c) =>
                  v.byCategory[c] > 0 ? (
                    <li key={c}>
                      {ALLOCATION_CATEGORY_LABELS[c]}: {formatMoney(v.byCategory[c], profile.currency)}
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-[#D4AF37]">Investments (tracking)</h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-zinc-500">
              Filter by venture
              <select
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                value={ventureFilter ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setVentureFilter(v === "" ? null : v);
                }}
              >
                <option value="">All ventures</option>
                {ventureRollups.map((v) => (
                  <option key={v.ventureName} value={v.ventureName}>
                    {v.ventureName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={addRow}
              className="rounded-lg border border-[#D4AF37]/40 px-3 py-1.5 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              Add row
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="pb-2">Venture</th>
                <th className="pb-2">Label</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Committed</th>
                <th className="pb-2">Illustr. return %</th>
                <th className="pb-2">As of</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {filteredInvestments.map((row) => (
                <tr key={row.id} className="border-t border-zinc-800/80">
                  <td className="py-2 pr-2">
                    <input
                      className="w-full min-w-[120px] rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm"
                      value={row.ventureName ?? ""}
                      placeholder="—"
                      onChange={(e) =>
                        updateInv(row.id, {
                          ventureName: e.target.value.trim() === "" ? undefined : e.target.value,
                        })
                      }
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      className="w-full min-w-[140px] rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm"
                      value={row.label}
                      onChange={(e) => updateInv(row.id, { label: e.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm"
                      value={row.category}
                      onChange={(e) => updateInv(row.id, { category: e.target.value as AllocationCategory })}
                    >
                      {ALLOCATION_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {ALLOCATION_CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      className="w-28 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm tabular-nums"
                      value={row.amountCommitted}
                      onChange={(e) =>
                        updateInv(row.id, { amountCommitted: Math.max(0, Number(e.target.value)) })
                      }
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      step={0.1}
                      className="w-24 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm tabular-nums"
                      value={row.illustrativeReturnPct ?? ""}
                      placeholder="—"
                      onChange={(e) =>
                        updateInv(row.id, {
                          illustrativeReturnPct:
                            e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="date"
                      className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm"
                      value={row.asOf?.slice(0, 10) ?? ""}
                      onChange={(e) => updateInv(row.id, { asOf: e.target.value })}
                    />
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeInv(row.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ventureFilter != null && (
          <p className="mt-3 text-xs text-zinc-500">
            Showing {filteredInvestments.length} of {investments.length} rows for &quot;{ventureFilter}&quot;. Allocation
            bars above still reflect the full portfolio.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-lg font-medium text-[#D4AF37]">Redeployment themes</h2>
        <ul className="mt-4 space-y-4">
          {redeploy.map((r, i) => (
            <li key={i} className="rounded-lg border border-zinc-800 bg-black/30 px-4 py-3">
              <p className="font-medium text-white">{r.title}</p>
              <p className="mt-2 text-sm text-zinc-400">{r.detail}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">
                Related: {r.relatedCategories.map((c) => ALLOCATION_CATEGORY_LABELS[c]).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
