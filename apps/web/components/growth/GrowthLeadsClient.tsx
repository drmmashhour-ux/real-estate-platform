"use client";

import * as React from "react";
import Link from "next/link";

type LeadRow = {
  id: string;
  name: string | null;
  email: string | null;
  pipelineStatus: string | null;
  score: number | null;
  source: string | null;
  campaign: string | null;
  leadType: string | null;
  createdAt: string;
};

export function GrowthLeadsClient({ locale, country }: { locale: string; country: string }) {
  const [rows, setRows] = React.useState<LeadRow[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    void fetch("/api/growth/leads")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error);
        setRows(j.leads ?? []);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!rows) return <p className="text-sm text-zinc-500">Loading leads…</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/60">
          <tr>
            <th className="px-3 py-2 font-medium text-zinc-400">Name</th>
            <th className="px-3 py-2 font-medium text-zinc-400">Status</th>
            <th className="px-3 py-2 font-medium text-zinc-400">Source</th>
            <th className="px-3 py-2 font-medium text-zinc-400">Type</th>
            <th className="px-3 py-2 font-medium text-zinc-400" />
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} className="border-b border-zinc-800/80">
              <td className="px-3 py-2 text-zinc-200">{l.name ?? "—"}</td>
              <td className="px-3 py-2 text-zinc-400">{l.pipelineStatus ?? "—"}</td>
              <td className="px-3 py-2 text-xs text-zinc-500">{l.source ?? "—"}</td>
              <td className="px-3 py-2 text-xs text-zinc-500">{l.leadType ?? "—"}</td>
              <td className="px-3 py-2">
                <Link
                  href={`/${locale}/${country}/dashboard/leads/${l.id}`}
                  className="text-emerald-400 hover:underline"
                >
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
