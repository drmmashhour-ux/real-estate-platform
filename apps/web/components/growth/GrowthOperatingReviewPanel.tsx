"use client";

import * as React from "react";
import type { GrowthOperatingReviewSummary } from "@/modules/growth/growth-operating-review.types";

function statusBadgeClass(status: GrowthOperatingReviewSummary["status"]): string {
  if (status === "strong") return "border-emerald-500/50 bg-emerald-950/35 text-emerald-100";
  if (status === "healthy") return "border-sky-500/45 bg-sky-950/30 text-sky-100";
  if (status === "watch") return "border-amber-500/45 bg-amber-950/35 text-amber-100";
  return "border-rose-500/45 bg-rose-950/35 text-rose-100";
}

function ItemList({
  title,
  items,
  empty,
}: {
  title: string;
  items: GrowthOperatingReviewSummary["worked"];
  empty: string;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h4>
      <ul className="mt-2 space-y-2 text-sm text-zinc-300">
        {items.length === 0 ? (
          <li className="text-zinc-500">{empty}</li>
        ) : (
          items.map((it) => (
            <li key={it.id} className="border-b border-zinc-800/80 pb-2 last:border-0">
              <span className="font-medium text-zinc-200">{it.title}</span>
              <p className="mt-0.5 text-xs text-zinc-500">{it.detail}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function GrowthOperatingReviewPanel() {
  const [summary, setSummary] = React.useState<GrowthOperatingReviewSummary | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/operating-review", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { error?: string; summary?: GrowthOperatingReviewSummary };
        if (r.status === 403) {
          throw new Error(
            j.error ??
              "Enable FEATURE_GROWTH_OPERATING_REVIEW_V1 for the advisory review API (panel flag alone is not sufficient).",
          );
        }
        if (!r.ok) throw new Error(j.error ?? "Operating review unavailable");
        return j.summary ?? null;
      })
      .then((s) => {
        if (!cancelled) {
          setSummary(s);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setErr(e.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading operating review…</p>;
  }
  if (err) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <h3 className="text-sm font-semibold text-zinc-200">🧾 Growth Operating Review</h3>
        <p className="mt-2 text-sm text-amber-200/90">{err}</p>
      </section>
    );
  }
  if (!summary) {
    return null;
  }

  return (
    <section
      className="rounded-xl border border-teal-900/45 bg-teal-950/15 p-4"
      data-growth-operating-review-panel
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-100">🧾 Growth Operating Review</h3>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(summary.status)}`}
        >
          {summary.status}
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">Week {summary.weekLabel} · advisory only</p>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <ItemList title="What worked" items={summary.worked} empty="No confident “worked” signals in inputs." />
        <ItemList title="What didn’t" items={summary.didntWork} empty="No strong “didn’t work” classification." />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <ItemList title="Blocked" items={summary.blocked} empty="No blocked items classified." />
        <ItemList title="Deferred" items={summary.deferred} empty="No deferrals classified." />
      </div>

      <div className="mt-6">
        <ItemList
          title="What changes next week"
          items={summary.nextWeekChanges}
          empty="No next-week suggestions (inputs may be quiet)."
        />
      </div>

      {summary.notes.length > 0 ? (
        <div className="mt-4 rounded-lg border border-zinc-800/80 bg-black/20 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Notes</h4>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-zinc-400">
            {summary.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
