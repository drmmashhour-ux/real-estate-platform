"use client";

import * as React from "react";
import type { CityPlaybookAdaptationBundle } from "@/modules/growth/city-playbook-adaptation.types";

export function CityPlaybookAdaptationPanel() {
  const [data, setData] = React.useState<CityPlaybookAdaptationBundle | null | "err" | "loading">("loading");
  const [disclaimer, setDisclaimer] = React.useState("");

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      const params = new URLSearchParams({ windowDays: "30" });
      const res = await fetch(`/api/admin/growth/fast-deal/city-playbook-adaptation?${params}`, {
        credentials: "same-origin",
      });
      if (cancel) return;
      if (!res.ok) {
        setData("err");
        return;
      }
      const j = (await res.json()) as {
        bundle: CityPlaybookAdaptationBundle | null;
        disclaimer?: string;
      };
      setData(j.bundle);
      setDisclaimer(j.disclaimer ?? "");
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (data === "loading") {
    return (
      <section className="rounded-xl border border-teal-900/40 bg-teal-950/10 p-4" data-growth-city-playbook-adaptation>
        <p className="text-xs text-zinc-500">Loading playbook adaptation…</p>
      </section>
    );
  }
  if (data === "err" || data === null) {
    return (
      <section className="rounded-xl border border-teal-900/40 bg-teal-950/10 p-4" data-growth-city-playbook-adaptation>
        <p className="text-sm text-amber-200/90">
          Playbook adaptation unavailable — requires admin access, Fast Deal city comparison, and adaptation flags.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-teal-800/45 bg-teal-950/15 p-4" data-growth-city-playbook-adaptation>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-300/90">Fast Deal · Adaptation</p>
        <h3 className="mt-1 text-lg font-semibold text-zinc-100">City playbook adaptation (internal)</h3>
        <p className="mt-1 max-w-3xl text-[11px] text-zinc-500">
          Guided replication suggestions from logged metrics — not automatic execution. {disclaimer}
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-950/15 px-3 py-2 text-[11px] text-amber-100/90">
        Never copy another city’s playbook wholesale. Always validate attribution and CRM hygiene before operational
        changes.
      </div>

      {!data.topCity ? (
        <p className="mt-4 text-sm text-zinc-400">
          No qualifying reference city for this window — see skipped markets below.
        </p>
      ) : (
        <div className="mt-4 rounded-lg border border-zinc-800 bg-black/25 p-4">
          <p className="text-xs font-semibold text-teal-200/90">Reference city (internal benchmark)</p>
          <p className="mt-2 text-lg font-semibold text-white">{data.topCity.city}</p>
          <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">Strengths (logged)</p>
              <ul className="mt-1 list-inside list-disc text-zinc-300">
                {data.topCity.signal.strengths.length === 0 ? (
                  <li className="text-zinc-500">No strengths above internal thresholds — check pattern detail.</li>
                ) : (
                  data.topCity.signal.strengths.map((s) => <li key={s}>{s}</li>)
                )}
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">Watch areas</p>
              <ul className="mt-1 list-inside list-disc text-zinc-400">
                {data.topCity.signal.weaknesses.length === 0 ? (
                  <li className="text-zinc-500">None flagged vs internal benchmarks.</li>
                ) : (
                  data.topCity.signal.weaknesses.map((w) => <li key={w}>{w}</li>)
                )}
              </ul>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            Signal confidence: <span className="capitalize text-zinc-300">{data.topCity.signal.confidence}</span> ·
            Template sample: {data.topCity.template.sampleSize} · Key patterns: {data.topCity.template.keyPatterns.length}
          </p>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {data.adaptations.map((a) => (
          <div key={a.targetCity} className="rounded-lg border border-zinc-800 bg-black/20 p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <h4 className="text-base font-semibold text-white">{a.targetCity}</h4>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-zinc-400">
                vs {a.sourceCity}
              </span>
              <span className="text-[11px] capitalize text-zinc-400">Confidence: {a.confidence}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{a.rationale}</p>
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase text-zinc-500">Suggested focus (review only)</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-300">
                {a.recommendedAdjustments.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="mt-3 text-[11px] text-zinc-500">
              <span className="font-semibold text-zinc-400">Constraints:</span> {a.constraints.join(" · ")}
            </div>
            <div className="mt-2 rounded border border-red-900/25 bg-black/30 p-2 text-[11px] text-zinc-500">
              {a.warnings.map((w) => (
                <p key={w}>· {w}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {data.skippedTargets.length > 0 ? (
        <div className="mt-6 rounded-lg border border-zinc-800 p-3 text-sm text-zinc-500">
          <p className="font-semibold text-zinc-400">Skipped targets</p>
          <ul className="mt-2 space-y-1">
            {data.skippedTargets.map((s) => (
              <li key={`${s.city}-${s.reason}`}>
                <span className="text-zinc-300">{s.city}:</span> {s.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 rounded-lg border border-zinc-800 bg-black/25 p-3">
        <p className="text-xs font-semibold text-zinc-400">Bundle insights</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-500">
          {data.insights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-[10px] text-zinc-600">Generated {new Date(data.generatedAt).toLocaleString()}</p>
    </section>
  );
}
