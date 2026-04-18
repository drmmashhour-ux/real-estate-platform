"use client";

import * as React from "react";

import type { AdDraft } from "@/modules/growth/ads-engine.types";

type DraftsJson = {
  city: string;
  drafts: AdDraft[];
  error?: string;
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <button
      type="button"
      className="rounded-md border border-zinc-600 bg-zinc-800/80 px-2 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        } catch {
          /* ignore */
        }
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

export function AdsExecutionPanel({ defaultCity = "Montréal" }: { defaultCity?: string }) {
  const [city, setCity] = React.useState(defaultCity);
  const [drafts, setDrafts] = React.useState<AdDraft[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void fetch(`/api/growth/ads-engine/drafts?city=${encodeURIComponent(city)}`, {
      credentials: "same-origin",
    })
      .then(async (r) => {
        const j = (await r.json()) as DraftsJson;
        if (!r.ok) throw new Error(j.error ?? "Failed to load");
        return j;
      })
      .then((j) => {
        if (!cancelled) setDrafts(j.drafts);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city, reloadToken]);

  return (
    <section
      className="rounded-xl border border-violet-900/40 bg-violet-950/15 p-4"
      data-growth-ads-execution-panel-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-300/90">Ads engine (V1)</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Draft copy & targeting</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Human-export only. No Meta/Google API calls from this panel — paste into Ads Manager yourself after review.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            City
            <input
              className="w-36 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="rounded-lg bg-violet-600/90 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            onClick={() => setReloadToken((n) => n + 1)}
          >
            Regenerate drafts
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">Loading ad drafts…</p>
      ) : err ? (
        <p className="mt-4 text-sm text-red-300">{err}</p>
      ) : drafts && drafts.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {drafts.map((d) => (
            <li
              key={d.id}
              className="rounded-lg border border-zinc-800/90 bg-black/25 p-3"
              data-growth-ad-draft={d.platform}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold uppercase text-zinc-300">
                  {d.platform}
                </span>
                <span className="text-[11px] text-zinc-500">Intent: {d.intent}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-zinc-100">{d.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">{d.description}</p>
              <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
                {d.targeting.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton text={d.title} label="Copy title" />
                <CopyButton text={d.description} label="Copy body" />
                <CopyButton text={[d.title, "", d.description, "", ...d.targeting].join("\n")} label="Copy all" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">No drafts.</p>
      )}
    </section>
  );
}
