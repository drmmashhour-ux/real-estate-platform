"use client";

import { useCallback, useEffect, useState } from "react";

type AgreementApi = {
  contentHtml?: string;
  error?: string;
};

type SnapshotApi = { contentMarkdown?: string; error?: string };

/**
 * Loads platform booking agreement (HTML) and optional generated markdown snapshot.
 */
export function AgreementViewer({ bookingId }: { bookingId: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [aRes, sRes] = await Promise.all([
        fetch(`/api/bnhub/booking-agreement?bookingId=${encodeURIComponent(bookingId)}`, { credentials: "include" }),
        fetch(`/api/bnhub/bookings/${encodeURIComponent(bookingId)}/agreement-document`, { credentials: "include" }),
      ]);
      const aJson = (await aRes.json()) as AgreementApi;
      if (aRes.ok && aJson.contentHtml) setHtml(aJson.contentHtml);
      else if (!aRes.ok) setErr(aJson.error ?? "No agreement on file");

      if (sRes.ok) {
        const sJson = (await sRes.json()) as SnapshotApi;
        if (sJson.contentMarkdown) setMarkdown(sJson.contentMarkdown);
      }
    } catch {
      setErr("Failed to load");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function generateSnapshot() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bnhub/bookings/${encodeURIComponent(bookingId)}/agreement-document`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as SnapshotApi;
      if (res.ok && data.contentMarkdown) setMarkdown(data.contentMarkdown);
      else setErr(data.error ?? "Could not generate");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !html && !markdown) {
    return <p className="text-sm text-slate-500">Loading agreement…</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">Booking agreement</h3>
        <button
          type="button"
          onClick={() => void generateSnapshot()}
          className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
        >
          Refresh summary (markdown)
        </button>
      </div>
      {err ? <p className="text-sm text-amber-200/90">{err}</p> : null}
      {html ? (
        <div
          className="prose prose-invert max-w-none prose-sm rounded-lg border border-slate-800 bg-slate-950/50 p-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
      {markdown ? (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-400">Plain summary (stored)</p>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
            {markdown}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
