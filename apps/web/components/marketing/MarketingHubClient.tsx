"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { MarketingHubDashboardVm } from "@/modules/marketing/marketing.types";

export function MarketingHubClient({
  initial,
  videosHref,
}: {
  initial: MarketingHubDashboardVm;
  videosHref?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function action(path: string, body?: object) {
    setBusy(path);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-10">
      {videosHref ? (
        <section className="rounded-2xl border border-amber-900/40 bg-gradient-to-br from-black via-zinc-950 to-black p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Short-form videos (LECIPM engine)</h2>
              <p className="mt-1 max-w-xl text-xs text-zinc-500">
                Scripted reels, JSON render manifests, and Hub drafts — reviewed before publish. Premium black/gold compositions only.
              </p>
            </div>
            <Link
              href={videosHref}
              className="rounded-lg border border-amber-600/50 bg-amber-950/30 px-4 py-2 text-sm font-medium text-amber-100 hover:border-amber-400 hover:bg-amber-950/60"
            >
              Open Video Console →
            </Link>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div>
              <h3 className="text-xs uppercase tracking-wide text-zinc-500">Video queue</h3>
              <ul className="mt-2 space-y-2 text-sm text-zinc-300">
                {(initial.videoReviewQueue ?? []).length === 0 ? (
                  <li className="text-zinc-600">No previews waiting.</li>
                ) : (
                  (initial.videoReviewQueue ?? []).slice(0, 6).map((v) => (
                    <li key={v.id} className="rounded-lg border border-white/10 px-3 py-2">
                      <span className="font-medium text-white">{v.title}</span>
                      <span className="ml-2 text-[10px] uppercase text-amber-500">{v.status}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-zinc-500">Scheduled reels</h3>
              <ul className="mt-2 space-y-2 text-sm text-zinc-300">
                {(initial.videoScheduled ?? []).length === 0 ? (
                  <li className="text-zinc-600">Nothing scheduled.</li>
                ) : (
                  (initial.videoScheduled ?? []).slice(0, 6).map((v) => (
                    <li key={v.id} className="rounded-lg border border-white/10 px-3 py-2">
                      <span className="text-white">{v.title}</span>
                      <p className="text-[11px] text-zinc-500">{v.scheduledAt ?? "—"}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-zinc-500">Top performing</h3>
              <ul className="mt-2 space-y-2 text-sm text-zinc-300">
                {(initial.videoTopPerforming ?? []).length === 0 ? (
                  <li className="text-zinc-600">Publish reels and sync metrics to populate.</li>
                ) : (
                  (initial.videoTopPerforming ?? []).slice(0, 6).map((v) => (
                    <li key={v.id} className="rounded-lg border border-white/10 px-3 py-2">
                      <span className="text-white">{v.title}</span>
                      <p className="text-[11px] text-zinc-500">
                        ~{v.impressionsApprox} impressions · ~{v.clicksApprox} clicks
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-zinc-950/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Automation</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!!busy}
              onClick={() => void action("/api/dashboard/marketing/auto-draft")}
              className="rounded-lg bg-emerald-700/80 px-3 py-2 text-sm text-white hover:bg-emerald-600"
            >
              {busy === "/api/dashboard/marketing/auto-draft" ? "…" : "Generate daily drafts"}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => void action("/api/dashboard/marketing/growth-hook")}
              className="rounded-lg bg-sky-700/80 px-3 py-2 text-sm text-white hover:bg-sky-600"
            >
              {busy === "/api/dashboard/marketing/growth-hook" ? "…" : "Sync growth signals"}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Drafts respect dedupe + daily limits. Growth sync creates drafts from live signals (still needs approval).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Content queue</h2>
        <ul className="mt-3 space-y-3">
          {initial.queue.length === 0 ? (
            <li className="text-sm text-zinc-500">No scheduled posts.</li>
          ) : (
            initial.queue.map((p) => (
              <li key={p.id} className="rounded-xl border border-white/10 px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-white">{p.title}</span>
                  <span className="text-xs text-zinc-500">{p.scheduledAt}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{p.caption.slice(0, 160)}…</p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Generated — pending approval</h2>
        <ul className="mt-3 space-y-4">
          {initial.generatedReady.length === 0 ? (
            <li className="text-sm text-zinc-500">No drafts.</li>
          ) : (
            initial.generatedReady.map((p) => (
              <li key={p.id} className="rounded-xl border border-amber-900/40 bg-zinc-950/40 px-4 py-3">
                <p className="font-medium text-white">{p.title}</p>
                <textarea
                  defaultValue={p.caption}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-200"
                  rows={4}
                  onBlur={(e) => {
                    void fetch(`/api/dashboard/marketing/posts/${p.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ caption: e.target.value }),
                    }).then(() => router.refresh());
                  }}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    type="datetime-local"
                    className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                    onChange={(e) => {
                      if (!e.target.value) return;
                      void fetch(`/api/dashboard/marketing/posts/${p.id}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ scheduledAt: new Date(e.target.value).toISOString() }),
                      }).then(() => router.refresh());
                    }}
                  />
                  <span className="text-[10px] text-zinc-600">Pick time → schedules with admin override</span>
                </div>
                {p.growthSignalRef ? (
                  <p className="mt-2 text-[10px] uppercase tracking-wide text-emerald-500">Growth signal {p.growthSignalRef}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white">Performance</h2>
          <dl className="mt-3 space-y-2 text-sm text-zinc-400">
            <div className="flex justify-between">
              <dt>Tracked posts</dt>
              <dd className="font-mono text-white">{initial.performance.postsTracked}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Clicks (approx)</dt>
              <dd className="font-mono text-white">{initial.performance.totalClicksApprox}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Impressions (approx)</dt>
              <dd className="font-mono text-white">{initial.performance.totalImpressionsApprox}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Leads attributed</dt>
              <dd className="font-mono text-white">{initial.performance.leadsAttributedApprox}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white">Strategy insights</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-400">
            {initial.strategyInsights.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
