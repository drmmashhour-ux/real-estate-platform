"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MarketplaceMemoryRole } from "@prisma/client";

type ProfileRow = {
  id: string;
  userId: string;
  role: MarketplaceMemoryRole;
  intentSummaryJson: unknown;
  preferenceSummaryJson: unknown;
  behaviorSummaryJson: unknown;
  financialProfileJson: unknown;
  esgProfileJson: unknown;
  riskProfileJson: unknown;
  personalizationEnabled: boolean;
  lastUpdatedAt: string;
};

type InsightRow = {
  id: string;
  insightType: string;
  key: string;
  value: string;
  confidenceScore: number;
  sourceEventsJson: unknown;
  createdAt: string;
};

const ROLES: MarketplaceMemoryRole[] = [
  MarketplaceMemoryRole.BUYER,
  MarketplaceMemoryRole.RENTER,
  MarketplaceMemoryRole.BROKER,
  MarketplaceMemoryRole.INVESTOR,
];

export default function MarketplaceMemoryDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [insights, setInsights] = useState<InsightRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [pr, ins] = await Promise.all([
        fetch("/api/memory/profile", { credentials: "include" }),
        fetch("/api/memory/insights", { credentials: "include" }),
      ]);
      const pj = (await pr.json()) as { ok?: boolean; disabled?: boolean; profile?: ProfileRow | null };
      const ij = (await ins.json()) as { ok?: boolean; disabled?: boolean; insights?: InsightRow[] };
      if (!pr.ok) {
        setMessage("Could not load memory profile");
        return;
      }
      setDisabled(Boolean(pj.disabled));
      setProfile(pj.profile ?? null);
      setInsights(ij.insights ?? []);
    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function savePatch(patch: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/memory/update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; profile?: ProfileRow };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Update failed");
        return;
      }
      setProfile(data.profile ?? null);
      await load();
      setMessage("Saved.");
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function resetAll() {
    if (!globalThis.confirm("Reset all marketplace memory? This clears events and inferred summaries.")) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/memory/reset", { method: "POST", credentials: "include" });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        setMessage("Reset failed");
        return;
      }
      await load();
      setMessage("Memory reset.");
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function reaggregate() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/memory/aggregate", { method: "POST", credentials: "include" });
      const data = (await res.json()) as { ok?: boolean; reason?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.reason ?? "Could not refresh");
        return;
      }
      await load();
      setMessage("Summaries refreshed from events.");
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function exportJson() {
    setBusy(true);
    try {
      const res = await fetch("/api/memory/export", { credentials: "include" });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lecipm-memory-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Export downloaded.");
    } catch {
      setMessage("Export failed");
    } finally {
      setBusy(false);
    }
  }

  const pref = profile?.preferenceSummaryJson as {
    topLocations?: { location: string; score: number }[];
    topPropertyTypes?: { propertyType: string; score: number }[];
    budgetRange?: { min: number | null; max: number | null; note?: string };
  } | null;

  if (loading) {
    return (
      <div className="min-h-[40vh] p-8 text-slate-400">
        <p className="text-sm">Loading memory…</p>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-8">
        <h1 className="text-xl font-semibold text-white">Marketplace memory</h1>
        <p className="text-sm text-slate-400">
          This intelligence layer is not enabled for this environment. Set{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-amber-200/90">FEATURE_MARKETPLACE_MEMORY_ENGINE_V1</code>{" "}
          to opt in.
        </p>
        <Link href="/dashboard/broker/watchlist" className="text-sm text-[#D4AF37] hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 p-8 text-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/90">Privacy-first</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Marketplace memory</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Inferred preferences from your activity on LECIPM / BNHub. You can edit, export, reset, or turn off
            personalization at any time. Nothing here is hidden — memory only assists ranking and recommendations; it does
            not control outcomes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void exportJson()}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
          >
            Export JSON
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void reaggregate()}
            className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-950/60 disabled:opacity-50"
          >
            Refresh from events
          </button>
        </div>
      </div>

      {message ? (
        <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">{message}</p>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <h2 className="text-lg font-medium text-white">Controls</h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Role context</span>
            <select
              className="rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-white"
              value={profile?.role ?? MarketplaceMemoryRole.BUYER}
              disabled={busy || !profile}
              onChange={(e) => {
                void savePatch({ role: e.target.value as MarketplaceMemoryRole });
              }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-black/60"
              checked={profile?.personalizationEnabled ?? true}
              disabled={busy || !profile}
              onChange={(e) => {
                void savePatch({ personalizationEnabled: e.target.checked });
              }}
            />
            <span>Allow personalization (when off, new signals are not stored and engines stay neutral)</span>
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void resetAll()}
            className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-100 hover:bg-red-950/50 disabled:opacity-50"
          >
            Reset all memory
          </button>
          <Link href="/dashboard/broker/compliance/audit" className="text-sm text-[#D4AF37]/90 hover:underline">
            View compliance audit trail
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-lg font-medium text-white">Locations</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {(pref?.topLocations ?? []).length === 0 ? (
              <li className="text-slate-500">No inferred locations yet.</li>
            ) : (
              pref?.topLocations?.map((x) => (
                <li key={x.location}>
                  {x.location}{" "}
                  <span className="text-slate-500">(weighted {x.score})</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
          <h2 className="text-lg font-medium text-white">Property types & budget</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {(pref?.topPropertyTypes ?? []).length === 0 ? (
              <li className="text-slate-500">No property-type signal yet.</li>
            ) : (
              pref?.topPropertyTypes?.map((x) => (
                <li key={x.propertyType}>
                  {x.propertyType}{" "}
                  <span className="text-slate-500">({x.score})</span>
                </li>
              ))
            )}
          </ul>
          {pref?.budgetRange ? (
            <p className="mt-4 text-sm text-slate-400">
              Budget hint:{" "}
              {pref.budgetRange.min != null || pref.budgetRange.max != null
                ? `${pref.budgetRange.min ?? "—"} – ${pref.budgetRange.max ?? "—"}`
                : "—"}
              {pref.budgetRange.note ? ` — ${pref.budgetRange.note}` : null}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 md:col-span-2">
          <h2 className="text-lg font-medium text-white">Investor / ESG / risk (if present)</h2>
          <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-black/60 p-4 text-xs text-slate-400">
            {JSON.stringify(
              {
                financial: profile?.financialProfileJson ?? null,
                esg: profile?.esgProfileJson ?? null,
                risk: profile?.riskProfileJson ?? null,
              },
              null,
              2,
            )}
          </pre>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <h2 className="text-lg font-medium text-white">Insights</h2>
        <p className="mt-2 text-sm text-slate-500">
          Each insight includes a confidence score and traceable source metadata. Delete any row you disagree with.
        </p>
        <ul className="mt-4 space-y-4">
          {insights.length === 0 ? (
            <li className="text-sm text-slate-500">No insights yet — activity and aggregation produce these.</li>
          ) : (
            insights.map((i) => (
              <li
                key={i.id}
                className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {i.insightType} · {i.key} · {(i.confidenceScore * 100).toFixed(0)}% confidence
                  </p>
                  <p className="mt-1 text-sm text-slate-200">{i.value}</p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  className="shrink-0 text-sm text-red-300/90 hover:text-red-200 disabled:opacity-50"
                  onClick={() => void savePatch({ deleteInsightIds: [i.id] })}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <h2 className="text-lg font-medium text-white">Raw summaries (editable)</h2>
        <p className="mt-2 text-sm text-slate-500">
          Advanced: merge JSON keys into stored summaries. Invalid shapes are rejected by the API.
        </p>
        <RawJsonEditor
          busy={busy}
          label="Preference summary patch"
          onSave={(obj) => void savePatch({ preferenceSummaryJson: obj })}
        />
      </section>
    </div>
  );
}

function RawJsonEditor({
  label,
  busy,
  onSave,
}: {
  label: string;
  busy: boolean;
  onSave: (obj: Record<string, unknown>) => void;
}) {
  const [text, setText] = useState("{}");
  return (
    <div className="mt-4 space-y-2">
      <label className="text-xs text-slate-500">{label}</label>
      <textarea
        className="min-h-[120px] w-full rounded-lg border border-white/15 bg-black/60 p-3 font-mono text-xs text-slate-300"
        value={text}
        disabled={busy}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="button"
        disabled={busy}
        className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15 disabled:opacity-50"
        onClick={() => {
          try {
            const obj = JSON.parse(text) as unknown;
            if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw new Error("object required");
            onSave(obj as Record<string, unknown>);
          } catch {
            globalThis.alert("Invalid JSON object");
          }
        }}
      >
        Merge into profile
      </button>
    </div>
  );
}
