"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { buildGlobalDashboardSnapshot, launchCountry } from "../global-country.service";
import { launchCountry as runLaunch } from "../global-launch.service";

import type { GlobalDashboardSnapshot } from "../global.types";

type Props = { adminBase: string };

export function GlobalExpansionDashboardClient({ adminBase }: Props) {
  const [tick, setTick] = useState(0);
  const snap = useMemo<GlobalDashboardSnapshot>(
    () => buildGlobalDashboardSnapshot(),
    [tick]
  );

  const [launching, setLaunching] = useState<string | null>(null);

  function onLaunch(code: string) {
    setLaunching(code);
    try {
      launchCountry(code);
      setTick((x) => x + 1);
    } finally {
      setLaunching(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 text-white">
      <header>
        <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/90">LECIPM global</p>
        <h1 className="text-2xl font-semibold">Global expansion</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Multi-country controls: languages, currency, hubs, and regulatory awareness (not legal advice). Data
          isolation is a product of routing + warehouse design — treat this view as governance and planning.
        </p>
        <p className="mt-1 text-[11px] text-zinc-600">{snap.dataIsolationNote}</p>
      </header>

      <section>
        <h2 className="text-sm font-semibold">1. Countries overview</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {snap.countries.map((c) => (
            <Link
              key={c.countryCode}
              href={`${adminBase}/global/${encodeURIComponent(c.countryCode)}`}
              className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-500/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{c.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                    c.expansionStatus === "active"
                      ? "bg-emerald-950 text-emerald-200"
                      : c.expansionStatus === "scaling"
                        ? "bg-sky-950 text-sky-200"
                        : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {c.expansionStatus}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {c.currency} · {c.defaultLanguage} · hubs: {c.activeHubs.slice(0, 4).join(", ")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold">2. Expansion pipeline</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase text-zinc-500">
              <tr>
                <th className="p-2">Country</th>
                <th className="p-2">Status</th>
                <th className="p-2">Readiness</th>
              </tr>
            </thead>
            <tbody>
              {snap.pipeline.map((p) => (
                <tr key={p.countryCode} className="border-b border-white/5">
                  <td className="p-2 font-medium">{p.name}</td>
                  <td className="p-2 text-zinc-400">{p.status}</td>
                  <td className="p-2 font-mono text-cyan-200/90">{p.expansionReadinessScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold">3. Performance by country (proxies)</h2>
        <p className="text-xs text-zinc-500">Directional metrics — reconcile in finance warehouse by market.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {snap.performance.map((p) => (
            <div key={p.countryCode} className="rounded-xl border border-white/10 bg-zinc-950/50 p-3 text-xs">
              <p className="font-semibold text-white">{p.countryCode}</p>
              <p>
                Revenue proxy: {(p.revenueCentsProxy / 100).toLocaleString()} (cents-scale) · Leads: {p.leadsProxy} ·
                Growth: {(p.growthRateProxy * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold">4. Risk / alerts</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {snap.alerts.map((a) => (
            <li
              key={a.id}
              className={`rounded-xl border px-3 py-2 ${
                a.severity === "critical"
                  ? "border-rose-700/50 bg-rose-950/30"
                  : a.severity === "important"
                    ? "border-amber-700/40 bg-amber-950/25"
                    : "border-white/10 bg-black/20"
              }`}
            >
              <span className="font-medium text-white">{a.title}</span>
              <p className="text-xs text-zinc-400">{a.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-dashed border-white/20 p-4">
        <h2 className="text-sm font-semibold">Launch action (demo)</h2>
        <p className="text-xs text-zinc-500">
          Runs orchestration checklist and records audit lines. Does not provision infrastructure.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {snap.countries.slice(0, 4).map((c) => (
            <button
              key={c.countryCode}
              type="button"
              disabled={launching === c.countryCode}
              onClick={() => onLaunch(c.countryCode)}
              className="rounded-lg border border-cyan-600/50 bg-cyan-950/40 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-950/60 disabled:opacity-50"
            >
              {launching === c.countryCode ? "…" : `Launch ${c.countryCode}`}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
