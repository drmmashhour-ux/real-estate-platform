"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: string;
  style: string;
  hook: string;
  caption: string;
  status: string;
  videoUrl: string | null;
  views: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  listing: { id: string; title: string; listingCode: string };
};

type LeaderboardRow = {
  id: string;
  style: string;
  hook: string;
  views: number;
  clicks: number;
  conversions: number;
  score: number;
  listing: { id: string; title: string; listingCode: string };
};

export function ContentMachineAdminClient({
  initialRows,
  leaderboardRows,
  listings,
}: {
  initialRows: Row[];
  leaderboardRows: LeaderboardRow[];
  listings: { id: string; title: string; listingCode: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [optimizationLog, setOptimizationLog] = useState<string | null>(null);

  async function runPipeline() {
    if (!listingId) return;
    setBusy("run");
    try {
      const res = await fetch("/api/admin/content-machine/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(j.error ?? "run failed");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function saveCaption(id: string, caption: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/content-machine/piece/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      if (!res.ok) throw new Error("save failed");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this generated content and its schedules?")) return;
    setBusy(id);
    try {
      await fetch(`/api/admin/content-machine/piece/${encodeURIComponent(id)}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function reschedule(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/content-machine/piece/${encodeURIComponent(id)}/reschedule`, {
        method: "POST",
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(j.error ?? "reschedule failed");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function previewOptimizationSignals() {
    setBusy("opt-preview");
    try {
      const res = await fetch("/api/admin/content-machine/optimize?percentile=0.1");
      const j = (await res.json()) as { signals?: unknown; error?: string };
      if (!res.ok) throw new Error(j.error ?? "preview failed");
      setOptimizationLog(JSON.stringify(j.signals ?? null, null, 2));
    } finally {
      setBusy(null);
    }
  }

  async function runOptimizationLoop() {
    if (
      !confirm(
        "Analyze the top 10% of pieces by score, then regenerate 5-piece batches (video + schedule) for up to 12 listings — cohort listings first?"
      )
    ) {
      return;
    }
    setBusy("opt-run");
    try {
      const res = await fetch("/api/admin/content-machine/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingLimit: 12, percentile: 0.1 }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(j.error ?? "optimization failed");
      setOptimizationLog(JSON.stringify(j, null, 2));
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      {leaderboardRows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <div className="border-b border-white/10 bg-white/[0.04] px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Top content (weighted score)</h2>
            <p className="mt-1 text-xs text-slate-400">
              Score = views + 5×clicks + 25×conversions. Use{" "}
              <code className="text-slate-300">GET /api/admin/content-machine/leaderboard?orderBy=score</code> for JSON.
            </p>
          </div>
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Style</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">v / c / conv</th>
                <th className="px-3 py-2">Listing</th>
                <th className="px-3 py-2">Hook</th>
                <th className="px-3 py-2">Piece id</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardRows.map((r, i) => (
                <tr key={r.id} className="border-b border-white/5 align-top">
                  <td className="px-3 py-2 tabular-nums text-slate-500">{i + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs text-premium-gold">{r.style}</td>
                  <td className="px-3 py-2 tabular-nums font-semibold text-slate-100">{r.score}</td>
                  <td className="px-3 py-2 text-xs tabular-nums text-slate-400">
                    {r.views} · {r.clicks} · {r.conversions}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className="font-medium text-slate-200">{r.listing.listingCode}</span>
                  </td>
                  <td className="max-w-xs px-3 py-2 text-xs text-slate-400">{r.hook}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-500">{r.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-sm font-semibold text-white">Optimization loop</h2>
        <p className="mt-1 text-xs text-slate-400">
          Uses the top 10% of pieces (by weighted score) to detect winning styles and hook patterns, then generates new
          batches with those signals (OpenAI prompt bias + script ordering). Requires some views/clicks/conversions
          first.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void previewOptimizationSignals()}
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs font-semibold text-white hover:bg-white/5 disabled:opacity-40"
          >
            {busy === "opt-preview" ? "Analyzing…" : "Preview signals (top 10%)"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void runOptimizationLoop()}
            className="rounded-lg bg-emerald-600/90 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            {busy === "opt-run" ? "Running loop…" : "Run optimization loop"}
          </button>
        </div>
        {optimizationLog ? (
          <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[10px] leading-snug text-slate-300">
            {optimizationLog}
          </pre>
        ) : null}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="text-sm font-semibold text-white">Run pipeline</h2>
        <p className="mt-1 text-xs text-slate-400">
          Generates 5 style variants, renders vertical JPEG cards, and schedules TikTok + Instagram slots (when enabled).
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block text-xs text-slate-400">
            Listing
            <select
              className="mt-1 block rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.listingCode} — {l.title.slice(0, 48)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={busy !== null || !listingId}
            onClick={() => void runPipeline()}
            className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-40"
          >
            {busy === "run" ? "Running…" : "Generate + video + schedule"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2">Listing</th>
              <th className="px-3 py-2">Style</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Hook</th>
              <th className="px-3 py-2">Preview</th>
              <th className="px-3 py-2">Metrics</th>
              <th className="px-3 py-2">Caption</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {initialRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  No generated rows yet. Run the pipeline for a published stay.
                </td>
              </tr>
            ) : (
              initialRows.map((r) => (
                <tr key={r.id} className="border-b border-white/5 align-top">
                  <td className="px-3 py-2 text-xs">
                    <div className="font-medium text-slate-100">{r.listing.listingCode}</div>
                    <div className="text-slate-500">{new Date(r.createdAt).toLocaleString()}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-premium-gold">{r.style}</td>
                  <td className="px-3 py-2 text-xs">{r.status}</td>
                  <td className="max-w-[200px] px-3 py-2 text-xs text-slate-300">{r.hook}</td>
                  <td className="px-3 py-2">
                    {r.videoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.videoUrl}
                        alt=""
                        className="h-40 w-[90px] rounded-md object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <span className="text-xs text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs tabular-nums text-slate-400">
                    v{r.views} · c{r.clicks} · conv{r.conversions}
                  </td>
                  <td className="max-w-md px-3 py-2">
                    <CaptionEditor
                      initial={r.caption}
                      disabled={busy === r.id}
                      onSave={(c) => void saveCaption(r.id, c)}
                    />
                  </td>
                  <td className="px-3 py-2 space-y-1">
                    <button
                      type="button"
                      className="block text-xs font-medium text-sky-400 hover:underline"
                      disabled={busy !== null || !r.videoUrl}
                      onClick={() => void reschedule(r.id)}
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      className="block text-xs font-medium text-red-400 hover:underline"
                      disabled={busy !== null}
                      onClick={() => void remove(r.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CaptionEditor({
  initial,
  disabled,
  onSave,
}: {
  initial: string;
  disabled: boolean;
  onSave: (c: string) => void;
}) {
  const [val, setVal] = useState(initial);
  return (
    <div className="space-y-1">
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        rows={4}
        disabled={disabled}
        className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs text-slate-100"
      />
      <button
        type="button"
        disabled={disabled || val === initial}
        onClick={() => onSave(val)}
        className="text-xs font-semibold text-premium-gold hover:underline disabled:opacity-30"
      >
        Save caption
      </button>
    </div>
  );
}
