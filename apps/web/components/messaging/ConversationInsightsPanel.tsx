"use client";

import { useCallback, useEffect, useState } from "react";

type Analysis = {
  sentiment: string;
  engagementScore: number;
  dealProbability: number;
  insights: string[];
};

type Profile = {
  budget: string | null;
  preferredArea: string | null;
  type: string | null;
};

export function ConversationInsightsPanel({
  conversationId,
  enabled,
}: {
  conversationId: string | null;
  enabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notes, setNotes] = useState("");
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    if (!conversationId || !enabled) {
      setAnalysis(null);
      setProfile(null);
      setNotes("");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/insights`, {
        credentials: "same-origin",
      });
      const j = (await res.json()) as {
        analysis?: Analysis;
        clientInsights?: { profile: Profile; notes: string };
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "Could not load insights");
      if (j.analysis) setAnalysis(j.analysis);
      if (j.clientInsights) {
        setProfile(j.clientInsights.profile);
        setNotes(j.clientInsights.notes ?? "");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setAnalysis(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [conversationId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  async function syncPrefs() {
    if (!conversationId) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/insights`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncPreferences: true }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Sync failed");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function saveNotes() {
    if (!conversationId) return;
    const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/memory`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    const j = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(j.error ?? "Save failed");
    await load();
  }

  if (!enabled) return null;

  return (
    <aside className="hidden w-[min(100%,320px)] shrink-0 border-l border-white/10 bg-black/25 xl:flex xl:flex-col xl:overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 px-3 py-3 backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Client intelligence</p>
        <p className="mt-1 text-xs text-slate-400">
          Every client interaction makes the system smarter — review AI hints before acting.
        </p>
      </div>
      <div className="flex-1 space-y-4 p-3 text-sm">
        {!conversationId ? (
          <p className="text-xs text-slate-500">Select a conversation to load deal outlook and CRM memory.</p>
        ) : null}
        {conversationId && loading ? <p className="text-xs text-slate-500">Loading…</p> : null}
        {err ? <p className="text-xs text-rose-400">{err}</p> : null}

        {analysis ? (
          <section className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[10px] font-semibold uppercase text-slate-500">Deal outlook</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500">Sentiment</p>
                <p className="font-medium text-white">{analysis.sentiment}</p>
              </div>
              <div>
                <p className="text-slate-500">Likelihood</p>
                <p className="font-medium text-emerald-300">{analysis.dealProbability}%</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500">Engagement</p>
                <p className="font-medium text-slate-200">{analysis.engagementScore}/100</p>
              </div>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-slate-300">
              {analysis.insights.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {profile ? (
          <section className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Client insights</p>
              <button
                type="button"
                disabled={syncing}
                onClick={() => void syncPrefs()}
                className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-slate-200 hover:bg-white/15 disabled:opacity-40"
              >
                {syncing ? "…" : "Sync from chat"}
              </button>
            </div>
            <dl className="mt-2 space-y-1 text-xs text-slate-200">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Budget</dt>
                <dd>{profile.budget ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Area</dt>
                <dd>{profile.preferredArea ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Type</dt>
                <dd>{profile.type ?? "—"}</dd>
              </div>
            </dl>
            <label className="mt-3 block text-[10px] font-semibold uppercase text-slate-500">Broker notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-slate-100"
            />
            <button
              type="button"
              onClick={() => void saveNotes().catch((e) => setErr(e instanceof Error ? e.message : "Save failed"))}
              className="mt-2 rounded-lg bg-premium-gold px-3 py-1.5 text-xs font-semibold text-black"
            >
              Save notes
            </button>
          </section>
        ) : null}

        <p className="text-[10px] leading-snug text-slate-600">
          CRM memory is broker-scoped. Honor consent and Quebec Law 25 — store only what you need for the deal.
        </p>
      </div>
    </aside>
  );
}
