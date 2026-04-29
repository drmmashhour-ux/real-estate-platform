"use client";

import { useCallback, useEffect, useState } from "react";

import { CITY_SLUGS, type CitySlug } from "@/lib/geo/city-search";
import { getSeoCityTelemetry, type SeoCityTelemetry } from "@/modules/seo-city/seo-city-telemetry.client";
import { readSeoCityOverrides, writeSeoCityOverrideClient } from "@/modules/seo-city/seo-city-local-overrides.client";

type Props = { country: string; locale: string; base: string };

export function SeoCityAdminClient({ country, locale, base }: Props) {
  const [slug, setSlug] = useState<CitySlug>(CITY_SLUGS[0] ?? "montreal");
  const [kind, setKind] = useState("CITY");
  const [json, setJson] = useState("{}");
  const [telemetry, setTelemetry] = useState<SeoCityTelemetry | null>(null);

  const refresh = useCallback(() => {
    setTelemetry(getSeoCityTelemetry());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const load = () => {
    const o = readSeoCityOverrides(country, slug, kind);
    setJson(JSON.stringify(o ?? {}, null, 2));
  };

  const save = () => {
    try {
      const parsed = JSON.parse(json) as object;
      writeSeoCityOverrideClient(country, slug, kind, parsed);
    } catch {
      return;
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Quick links (preview city SEO)</h2>
        <ul className="mt-3 list-inside list-disc text-sm text-slate-700">
          {CITY_SLUGS.map((s) => (
            <li key={s}>
              <a className="text-rose-600 hover:underline" href={`${base}/city/${s}`}>
                {s} hub
              </a>
              {" · "}
              <a className="text-rose-600 hover:underline" href={`${base}/city/${s}/brokers`}>
                brokers
              </a>
              {" · "}
              <a className="text-rose-600 hover:underline" href={`${base}/city/${s}/rentals`}>
                rentals
              </a>
              {" · "}
              <a className="text-rose-600 hover:underline" href={`${base}/city/${s}/investment`}>
                investment
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">Locale: {locale} / {country}. Pages respect rollout (`isCitySearchPageEnabled`).</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Client copy overrides (localStorage)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Key <code className="rounded bg-slate-100 px-1">lecipm-seo-city-overrides-v1</code> — used for experiments; connect to a DB for production editorial control.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm text-slate-700">
            City
            <select
              className="ml-2 rounded-lg border border-slate-200 px-2 py-1"
              value={slug}
              onChange={(e) => setSlug(e.target.value as CitySlug)}
            >
              {CITY_SLUGS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Kind
            <input
              className="ml-2 w-32 rounded-lg border border-slate-200 px-2 py-1"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            />
          </label>
          <button type="button" onClick={load} className="rounded-lg bg-slate-900 px-3 py-1 text-sm text-white">
            Load
          </button>
          <button type="button" onClick={save} className="rounded-lg border border-slate-200 px-3 py-1 text-sm">
            Save JSON
          </button>
        </div>
        <textarea
          className="mt-3 w-full min-h-[140px] rounded-lg border border-slate-200 p-3 font-mono text-xs"
          value={json}
          onChange={(e) => setJson(e.target.value)}
          spellCheck={false}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Telemetry (this browser)</h2>
          <button type="button" onClick={refresh} className="text-sm text-rose-600 hover:underline">
            Refresh
          </button>
        </div>
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900/90 p-3 text-xs text-slate-100">
          {telemetry ? JSON.stringify(telemetry, null, 2) : "{}"}
        </pre>
      </section>
    </div>
  );
}
