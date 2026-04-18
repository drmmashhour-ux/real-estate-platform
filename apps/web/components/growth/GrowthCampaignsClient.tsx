"use client";

import * as React from "react";

type Row = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};

export function GrowthCampaignsClient() {
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(() => {
    void fetch("/api/growth/campaigns")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error);
        setRows(j.campaigns ?? []);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!rows) return <p className="text-sm text-zinc-500">Loading campaigns…</p>;

  return (
    <div className="space-y-4">
      <button
        type="button"
        disabled={creating}
        onClick={() => {
          setCreating(true);
          void fetch("/api/growth/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `Campaign ${new Date().toISOString().slice(0, 10)}`,
              utmSource: "lecipm",
              utmMedium: "growth_os",
              utmCampaign: `gm_${Date.now()}`,
            }),
          })
            .then((r) => r.json())
            .then((j) => {
              if (j.error) throw new Error(j.error);
              load();
            })
            .catch((e: Error) => setErr(e.message))
            .finally(() => setCreating(false));
        }}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
      >
        {creating ? "Creating…" : "Create draft campaign (admin/accountant)"}
      </button>
      <p className="text-xs text-zinc-600">
        If the button fails with 403, your role cannot create campaigns — use an admin account or existing admin APIs.
      </p>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/60">
            <tr>
              <th className="px-3 py-2 font-medium text-zinc-400">Name</th>
              <th className="px-3 py-2 font-medium text-zinc-400">UTM</th>
              <th className="px-3 py-2 font-medium text-zinc-400">Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-zinc-800/80">
                <td className="px-3 py-2 text-zinc-200">{c.name}</td>
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {c.utmSource ?? "—"} / {c.utmMedium ?? "—"} / {c.utmCampaign ?? "—"}
                </td>
                <td className="px-3 py-2 text-zinc-400">{c.isActive ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
