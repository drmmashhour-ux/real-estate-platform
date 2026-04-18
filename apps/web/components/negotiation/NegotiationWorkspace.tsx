"use client";

import { useCallback, useEffect, useState } from "react";

type Props = { dealId: string };

export function NegotiationWorkspace({ dealId }: Props) {
  const [data, setData] = useState<unknown>(null);
  const [diff, setDiff] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setErr(null);
    try {
      const [n, d] = await Promise.all([
        fetch(`/api/deals/${dealId}/negotiation`, { credentials: "include" }),
        fetch(`/api/deals/${dealId}/negotiation/diff`, { credentials: "include" }),
      ]);
      const [nj, dj] = await Promise.all([n.json(), d.json()]);
      if (!n.ok) throw new Error(nj.error ?? "negotiation");
      if (!d.ok) setDiff({ error: dj.error ?? "diff disabled" });
      else setDiff(dj);
      setData(nj);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }, [dealId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runCopilot = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/negotiation/run`, {
        method: "POST",
        credentials: "include",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "run failed");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-sky-500/20 bg-zinc-950/80 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg text-sky-100">Negotiation copilot</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Suggestions require broker approval — nothing is sent to the other party automatically.
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          className="rounded-lg bg-sky-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          onClick={() => void runCopilot()}
        >
          {loading ? "Running…" : "Generate suggestions"}
        </button>
      </div>
      {err ? <p className="mt-3 text-sm text-amber-400">{err}</p> : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">PP ↔ CP diff (mapper)</h3>
          <pre className="mt-2 max-h-48 overflow-auto rounded border border-zinc-800 bg-black/40 p-2 font-mono text-[10px] text-zinc-400">
            {JSON.stringify(diff, null, 2)}
          </pre>
        </div>
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Thread &amp; suggestions</h3>
          <pre className="mt-2 max-h-48 overflow-auto rounded border border-zinc-800 bg-black/40 p-2 font-mono text-[10px] text-zinc-400">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}
