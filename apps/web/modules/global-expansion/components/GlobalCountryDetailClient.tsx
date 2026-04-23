"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { buildCountryDetailView } from "../global-country.service";
import { tUi, defaultLocaleForCountry } from "../global-localization.service";
import { formatCurrencyDisplay } from "../global-currency.service";

type Props = { countryCode: string; adminBase: string };

export function GlobalCountryDetailClient({ countryCode, adminBase }: Props) {
  const [tick, setTick] = useState(0);
  const view = useMemo(() => buildCountryDetailView(countryCode), [countryCode, tick]);
  const loc = defaultLocaleForCountry(countryCode);

  if (!view) {
    return (
      <div className="p-6 text-zinc-400">
        Country not found.
        <Link href={`${adminBase}/global`} className="mt-4 block text-cyan-400 underline">
          ← Back
        </Link>
      </div>
    );
  }

  const c = view.country;
  const sampleMoney = formatCurrencyDisplay(1_000_00, c.currency, loc === "ar" ? "en" : loc);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase text-zinc-500">{c.countryCode}</p>
          <h1 className="text-2xl font-semibold">{c.name}</h1>
          <p className="text-sm text-zinc-400">
            {tUi("market.language.base", loc)} · {c.timezone} · {sampleMoney.formatted} sample
          </p>
        </div>
        <Link href={`${adminBase}/global`} className="text-sm text-cyan-300 underline">
          ← All countries
        </Link>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
        <h2 className="text-sm font-semibold">Active hubs & features</h2>
        <p className="mt-2 text-zinc-300">Hubs: {c.activeHubs.join(", ")}</p>
        <p className="text-zinc-300">Features: {c.enabledFeatures.join(", ")}</p>
        <p className="mt-2 text-xs text-amber-200/80">
          Regulatory flags: {c.regulatoryFlags.join(", ")} — review with counsel, not self-serve compliance.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-4">
          <h2 className="text-sm font-semibold">Entry strategy</h2>
          <p className="mt-2 text-xs text-zinc-400">Cities: {view.strategy.entryCities.join(", ")}</p>
          <p className="mt-1 text-xs text-zinc-400">Primary hub: {view.strategy.primaryHub}</p>
          <p className="mt-2 text-sm text-zinc-300">{view.strategy.salesApproach}</p>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <h2 className="text-sm font-semibold">Performance (proxy)</h2>
          <p className="text-xs text-zinc-500">Leads {view.performance.leadsProxy}</p>
          <p className="text-xs text-zinc-500">Growth {(view.performance.growthRateProxy * 100).toFixed(1)}%</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 p-4">
        <h2 className="text-sm font-semibold">Regulation view</h2>
        <p className="text-xs text-rose-200/90">{view.regulation.disclaimer}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 text-xs">
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Allowed (labels)</p>
            <ul className="list-disc pl-4 text-zinc-300">
              {view.regulation.allowedActions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Restricted</p>
            <ul className="list-disc pl-4 text-amber-200/90">
              {view.regulation.restrictedActions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 p-4 text-xs text-zinc-400">
        <h2 className="text-sm font-semibold text-white">Integrations (awareness)</h2>
        <p className="mt-2">{view.integrationNotes.marketDomination}</p>
        <p className="mt-1">{view.integrationNotes.cityLaunch}</p>
        <p className="mt-1">{view.integrationNotes.growthBrain}</p>
        <p className="mt-1">{view.integrationNotes.revenuePredictor}</p>
        <button
          type="button"
          onClick={() => setTick((x) => x + 1)}
          className="mt-3 text-cyan-400 underline"
        >
          Refresh integration hints
        </button>
      </section>

      {view.launchHistory ? (
        <section className="rounded-2xl border border-emerald-800/30 bg-emerald-950/20 p-4 text-sm">
          <h2 className="text-sm font-semibold text-emerald-200">Launch record</h2>
          <p className="text-xs text-zinc-400">{view.launchHistory.auditLine}</p>
          <ul className="mt-2 list-disc pl-5 text-xs">
            {view.launchHistory.stepsCompleted.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="text-xs text-zinc-500">
        <h2 className="text-sm font-semibold text-zinc-300">Explainability</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {view.explainability.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
