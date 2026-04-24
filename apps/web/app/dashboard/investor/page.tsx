"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LaunchSequencerSummaryStrip } from "@/components/launch-sequencer/LaunchSequencerSummaryStrip";
import { RecommendationsInvestorStrip } from "@/components/recommendations/RecommendationsInvestorStrip";
import type { InvestorDashboardPayload } from "@/modules/investor/investor-dashboard-performance.service";

function cad(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(
    n,
  );
}

function pct(n: number | null) {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export default function InvestorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InvestorDashboardPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/investor/dashboard", { credentials: "include" });
      const json = (await res.json()) as InvestorDashboardPayload & { error?: string };
      if (!res.ok) {
        setMessage(json.error ?? "Could not load dashboard");
        setData(null);
        return;
      }
      if (!json.ok) {
        setMessage("Invalid response");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setMessage("Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 text-slate-900">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Investor</p>
          <h1 className="text-3xl font-semibold tracking-tight">Portfolio dashboard</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Overview of invested capital, modeled value, and delivery history. Figures are illustrative unless your
            administrator provides audited statements.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/memory"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Marketplace memory
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {message ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {message}
        </div>
      ) : null}

      <div className="mb-6">
        <LaunchSequencerSummaryStrip />
      </div>

      <RecommendationsInvestorStrip />

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : data ? (
        <div className="space-y-10">
          <div
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700"
            role="note"
          >
            <span className="font-medium">Data source:</span>{" "}
            {data.source === "bnhub" ? "BNHub investor scope + listings" : "Saved deal analyses only"}.
            <span className="mt-1 block text-slate-600">{data.disclaimer}</span>
          </div>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Overview</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">Total invested</p>
                <p className="mt-1 text-2xl font-semibold">{cad(data.overview.totalInvested)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">Total value (modeled)</p>
                <p className="mt-1 text-2xl font-semibold">{cad(data.overview.totalValue)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">Profit / loss</p>
                <p
                  className={`mt-1 text-2xl font-semibold ${
                    data.overview.profitLoss >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {cad(data.overview.profitLoss)}{" "}
                  <span className="text-base font-normal text-slate-600">({pct(data.overview.profitLossPercent)})</span>
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">Active deals</p>
                <p className="mt-1 text-2xl font-semibold">{data.overview.activeDeals}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Performance</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">Realized (report delta)</p>
                <p className="mt-1 text-xl font-semibold">{cad(data.performance.realizedReturns)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">Unrealized (modeled)</p>
                <p className="mt-1 text-xl font-semibold">{cad(data.performance.unrealizedReturns)}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-600">{data.performance.notes}</p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Investments</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Asset</th>
                    <th className="px-4 py-3 font-medium">Invested</th>
                    <th className="px-4 py-3 font-medium">Est. value</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Return est.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No investments in this view yet.
                      </td>
                    </tr>
                  ) : (
                    data.deals.map((d) => (
                      <tr key={d.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{d.title}</div>
                          <div className="text-xs text-slate-500">
                            {d.city} · {d.listingStatus}
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{d.amountInvested != null ? cad(d.amountInvested) : "—"}</td>
                        <td className="px-4 py-3 tabular-nums">{d.estimatedValue != null ? cad(d.estimatedValue) : "—"}</td>
                        <td className="px-4 py-3">{d.status}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {d.returnEstimatePercent != null ? `${d.returnEstimatePercent.toFixed(1)}%` : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Reports</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Monthly rollup</h3>
                <div className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white text-sm shadow-sm">
                  {data.reports.monthly.length === 0 ? (
                    <p className="p-4 text-slate-500">No report deliveries yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {data.reports.monthly.map((r) => (
                        <li key={r.period} className="flex justify-between px-4 py-2">
                          <span className="text-slate-600">{r.period}</span>
                          <span className="tabular-nums text-slate-900">
                            {cad(r.revenue)} · {r.bookings} bookings
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Yearly summary</h3>
                <div className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white text-sm shadow-sm">
                  {data.reports.yearly.length === 0 ? (
                    <p className="p-4 text-slate-500">No multi-year report history yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {data.reports.yearly.map((r) => (
                        <li key={r.year} className="flex justify-between px-4 py-2">
                          <span className="text-slate-600">{r.year}</span>
                          <span className="tabular-nums text-slate-900">
                            {cad(r.revenue)} · {r.bookings} bookings
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Documents</h2>
            <p className="mb-3 text-sm text-slate-600">
              Subscription and legal acknowledgments tied to your account, plus successful report deliveries (metadata
              only).
            </p>
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
              {data.documents.length === 0 ? (
                <li className="px-4 py-6 text-center text-slate-500">No documents on file.</li>
              ) : (
                data.documents.map((doc, i) => (
                  <li key={`${doc.kind}-${doc.createdAt}-${i}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <div>
                      <span className="font-medium text-slate-900">{doc.title}</span>
                      <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{doc.kind}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <time dateTime={doc.createdAt}>{doc.createdAt.slice(0, 10)}</time>
                      {doc.kind === "report" && doc.reportLogId && data.source === "bnhub" ? (
                        <a
                          href={`/api/investor/report/download?id=${encodeURIComponent(doc.reportLogId)}`}
                          className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Download PDF
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          {data.analyses.length > 0 ? (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Saved analyses</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">City</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Modeled value</th>
                      <th className="px-4 py-3 font-medium">ROI</th>
                      <th className="px-4 py-3 font-medium">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.analyses.map((a) => (
                      <tr key={a.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3">{a.city}</td>
                        <td className="px-4 py-3 tabular-nums">{cad(a.propertyPrice)}</td>
                        <td className="px-4 py-3 tabular-nums">{cad(a.modeledValue)}</td>
                        <td className="px-4 py-3 tabular-nums">{a.roi.toFixed(2)}%</td>
                        <td className="px-4 py-3">{a.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
