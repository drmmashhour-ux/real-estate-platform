"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

type Result = { label: string; href: string };

export default function AdminLookupPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async () => {
    const t = q.trim();
    if (!t) {
      setResults([]);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/lookup?q=${encodeURIComponent(t)}`);
      const data = (await res.json()) as { results?: Result[]; error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Lookup failed");
        setResults([]);
        return;
      }
      setResults(data.results ?? []);
    } catch {
      setErr("Network error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-lg">
        <Link href="/admin/dashboard" className="text-sm text-amber-400 hover:text-amber-300">
          ← Control center
        </Link>
        <h1 className="mt-4 text-xl font-semibold">Support code lookup</h1>
        <p className="mt-2 text-sm text-slate-400">
          Paste USR-, LST-, INV-, BKG-, DEL-, or DSP- codes. Listing codes (LST/LEC) also work.
        </p>
        <div className="mt-6 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void run()}
            placeholder="e.g. USR-000042 or LST-000001"
            className="input-premium mt-0 min-w-0 flex-1 font-mono text-sm"
          />
          <button type="button" onClick={() => void run()} className="btn-primary shrink-0" disabled={loading}>
            {loading ? "…" : "Lookup"}
          </button>
        </div>
        {err ? <p className="mt-3 text-sm text-red-400">{err}</p> : null}
        {results.length === 0 && !loading && q.trim() && !err ? (
          <p className="mt-4 text-sm text-slate-500">No matches for that code.</p>
        ) : null}
        <ul className="mt-6 space-y-2">
          {results.map((r) => (
            <li key={r.href + r.label}>
              <Link href={r.href} className="block rounded-lg border border-white/10 bg-slate-900/80 px-4 py-3 text-sm hover:border-amber-500/40">
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
