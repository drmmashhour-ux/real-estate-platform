"use client";

import { useCallback, useState } from "react";

type LaunchResponse = {
  ok?: boolean;
  action?: string;
  message?: string;
  error?: string;
  shareUrls?: {
    campaignSlug: string;
    evaluateMeta: string;
    evaluateUtm: string;
    homeSocial: string;
  };
};

export function LaunchFirstCampaignPanel({ baseUrl }: { baseUrl: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LaunchResponse | null>(null);

  const launch = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/growth/campaigns/launch-first", {
        method: "POST",
        credentials: "same-origin",
      });
      const j = (await res.json().catch(() => ({}))) as LaunchResponse;
      if (!res.ok) {
        setResult({ error: j.error ?? "Request failed" });
        return;
      }
      setResult(j);
    } catch {
      setResult({ error: "Network error" });
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="rounded-xl border border-amber-500/35 bg-slate-900/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
        Launch
      </p>
      <h2 className="mt-2 text-lg font-semibold text-slate-100">First acquisition campaign</h2>
      <p className="mt-2 text-sm text-slate-400">
        Activates your oldest <strong className="text-slate-300">DRAFT</strong> campaign, or creates
        &quot;LECIPM — Property evaluation launch&quot; as <strong className="text-slate-300">ACTIVE</strong>{" "}
        if none exist. Tracking uses first-touch cookies from{" "}
        <code className="text-amber-300/90">?source=&amp;campaign=&amp;medium=</code> or{" "}
        <code className="text-amber-300/90">utm_*</code>.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        App base for links: <code className="text-slate-400">{baseUrl}</code>
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={() => void launch()}
        className="mt-4 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
      >
        {loading ? "Launching…" : "Launch first campaign"}
      </button>
      {result?.error ? (
        <p className="mt-3 text-sm text-red-400">{result.error}</p>
      ) : null}
      {result?.ok && result.message ? (
        <p className="mt-3 text-sm text-emerald-400">{result.message}</p>
      ) : null}
      {result?.shareUrls ? (
        <div className="mt-4 space-y-3 border-t border-slate-800 pt-4 text-sm">
          <p className="font-medium text-slate-300">
            Share URLs <span className="text-slate-500">(campaign: {result.shareUrls.campaignSlug})</span>
          </p>
          <div>
            <p className="text-xs uppercase text-slate-500">Evaluate — Meta-style params</p>
            <textarea
              readOnly
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300"
              rows={2}
              value={result.shareUrls.evaluateMeta}
            />
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Evaluate — Google Ads (UTM)</p>
            <textarea
              readOnly
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300"
              rows={2}
              value={result.shareUrls.evaluateUtm}
            />
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Home — social teaser</p>
            <textarea
              readOnly
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300"
              rows={2}
              value={result.shareUrls.homeSocial}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
