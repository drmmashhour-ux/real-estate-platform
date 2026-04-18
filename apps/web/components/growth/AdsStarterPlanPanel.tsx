"use client";

import * as React from "react";

import { buildStarterAdsPlan } from "@/modules/growth/ads-setup.service";

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

const SETUP_STEPS = [
  "Open Meta Ads Manager (manual) — this panel does not connect to Meta.",
  "Create a new campaign objective that matches your landing (e.g. traffic or leads).",
  `Set lifetime or daily budget to match the plan ($10/day × 5 days = $50).`,
  "Paste primary text and CTA below; set placement to Facebook feed for your market.",
  "Use your existing LECIPM landing URL as the destination — track leads in CRM.",
  "After launch, monitor in CRM + Growth funnel — respond to leads within minutes.",
] as const;

export function AdsStarterPlanPanel({ defaultCity = "Montréal" }: { defaultCity?: string }) {
  const [city, setCity] = React.useState(defaultCity);
  const plan = React.useMemo(() => buildStarterAdsPlan(city), [city]);

  const fullCopy = [plan.copy, "", `CTA: ${plan.cta}`].join("\n");

  return (
    <section
      className="rounded-xl border border-fuchsia-900/40 bg-fuchsia-950/15 p-4"
      data-growth-ads-starter-plan-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fuchsia-300/90">
            $50 ads starter (V1)
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">High-conversion draft</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Budget is a planning reference — you enter spend manually in Ads Manager. No platform API keys or automated
            spend.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          City
          <input
            className="w-40 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2">
          <p className="text-[11px] uppercase text-zinc-500">Platform</p>
          <p className="text-lg font-semibold capitalize text-zinc-100">{plan.platform}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2">
          <p className="text-[11px] uppercase text-zinc-500">Total / daily / days</p>
          <p className="text-lg font-semibold text-zinc-100">
            ${plan.budgetTotal} · ${plan.dailyBudget}/day · {plan.durationDays} days
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2">
          <p className="text-[11px] uppercase text-zinc-500">Suggested CTA</p>
          <p className="text-lg font-semibold text-fuchsia-200">{plan.cta}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Targeting</p>
        <ul className="mt-1 list-inside list-disc text-sm text-zinc-300">
          {plan.targeting.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-800/90 bg-zinc-950/50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Primary</p>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-200">{plan.copy}</pre>
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyButton text={plan.copy} label="Copy primary" />
          <CopyButton text={plan.cta} label="Copy CTA" />
          <CopyButton text={fullCopy} label="Copy primary + CTA" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Setup steps</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-zinc-400">
          {SETUP_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
