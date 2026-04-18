"use client";

import * as React from "react";

type Listing = { id: string; title: string | null; city: string | null; status: string | null; updatedAt: string };

export function GrowthListingsClient() {
  const [data, setData] = React.useState<{
    listings: Listing[];
    opportunities?: unknown[];
    note?: string;
  } | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    void fetch("/api/growth/listings")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error);
        setData(j);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return <p className="text-sm text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-6">
      {data.note ? <p className="text-sm text-amber-200/80">{data.note}</p> : null}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300">Your listings</h2>
        <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/60">
              <tr>
                <th className="px-3 py-2 font-medium text-zinc-400">Title</th>
                <th className="px-3 py-2 font-medium text-zinc-400">City</th>
                <th className="px-3 py-2 font-medium text-zinc-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.listings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-zinc-500">
                    No FSBO listings in scope — seller dashboard may have more context.
                  </td>
                </tr>
              ) : (
                data.listings.map((l) => (
                  <tr key={l.id} className="border-b border-zinc-800/80">
                    <td className="px-3 py-2 text-zinc-200">{l.title ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-400">{l.city ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-400">{l.status ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {data.opportunities && data.opportunities.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-zinc-300">Top opportunities</h2>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
            {JSON.stringify(data.opportunities, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
