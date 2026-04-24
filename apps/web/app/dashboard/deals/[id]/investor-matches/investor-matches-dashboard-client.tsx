"use client";

import * as React from "react";
import Link from "next/link";

type MatchRow = {
  investorId: string;
  score: number;
  fitReasons: string[];
  penalties: string[];
  complianceOk: boolean;
  complianceBlockers: string[];
  canPreparePrivatePacket: boolean;
};

export function InvestorMatchesDashboardClient({ dealId }: { dealId: string }) {
  const [rows, setRows] = React.useState<MatchRow[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setErr(null);
    const r = await fetch(`/api/deals/${dealId}/investor-matches`, { credentials: "include" });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error ?? "Failed to load matches");
      setRows([]);
      return;
    }
    setRows((j.matches as MatchRow[]) ?? []);
  }, [dealId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    setBusy("refresh");
    setErr(null);
    try {
      const r = await fetch(`/api/deals/${dealId}/investor-matches/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error ?? "Refresh failed");
        return;
      }
      setRows((j.matches as MatchRow[]) ?? []);
    } finally {
      setBusy(null);
    }
  }

  async function preparePacket(investorId: string) {
    setBusy(`prep:${investorId}`);
    setErr(null);
    try {
      const r = await fetch(`/api/deals/${dealId}/investor-matches/${investorId}/prepare-packet`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(
          j.blockers && Array.isArray(j.blockers) ? `Blocked: ${(j.blockers as string[]).join(" · ")}` : (j.error ?? "Prepare failed"),
        );
        await load();
        return;
      }
      window.location.href = `/dashboard/deals/${dealId}/investor-packet/${investorId}`;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Investor matches</h1>
          <p className="text-muted-foreground font-mono text-xs">{dealId}</p>
          <p className="text-muted-foreground mt-2 max-w-2xl text-xs">
            Advisory ranking only — not a public solicitation. Compliance blockers stay visible; private packet prep stays
            broker-triggered and never auto-sent.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/deals/${dealId}/playbook`} className="rounded-md border px-3 py-1.5 text-xs">
            Playbook
          </Link>
          <Link href={`/dashboard/deals/${dealId}/investors`} className="rounded-md border px-3 py-1.5 text-xs">
            Investors
          </Link>
          <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => void load()}>
            Reload
          </button>
          <button
            type="button"
            disabled={busy !== null}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
            onClick={() => void refresh()}
          >
            {busy === "refresh" ? "Refreshing…" : "Refresh ranking (audit)"}
          </button>
        </div>
      </div>

      {err ? <p className="rounded border border-red-200 bg-red-50 p-3 text-red-800">{err}</p> : null}

      <div className="space-y-4">
        {rows.map((m) => (
          <div key={m.investorId} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-muted-foreground">Investor {m.investorId.slice(0, 12)}…</p>
                <p className="mt-1 text-lg font-semibold">Score {m.score}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {m.complianceOk ?
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    Compliance OK for packet prep
                  </span>
                : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                    Sharing / packet prep blocked
                  </span>
                }
                <button
                  type="button"
                  disabled={busy !== null || !m.canPreparePrivatePacket}
                  className="rounded-md border border-slate-800 bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                  onClick={() => void preparePacket(m.investorId)}
                >
                  {busy === `prep:${m.investorId}` ? "Preparing…" : "Prepare private packet"}
                </button>
                {!m.canPreparePrivatePacket ?
                  <span className="max-w-xs text-right text-[10px] text-muted-foreground">
                    Resolve compliance items first — match stays visible internally.
                  </span>
                : null}
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Why matched</p>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {m.fitReasons.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Compliance / gaps
                </p>
                {m.complianceBlockers.length ?
                  <ul className="mt-1 list-inside list-disc text-xs text-amber-900">
                    {m.complianceBlockers.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                : <p className="text-muted-foreground mt-1 text-xs">No packet blockers detected.</p>}
                {m.penalties.length ?
                  <p className="text-muted-foreground mt-2 text-[10px]">
                    Fit penalties (internal): {m.penalties.join(", ")}
                  </p>
                : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Link
                href={`/dashboard/deals/${dealId}/investor-packet/${m.investorId}`}
                className="text-blue-600 underline"
              >
                Open packet workspace
              </Link>
            </div>
          </div>
        ))}
        {rows.length === 0 && !err ?
          <p className="text-muted-foreground text-xs">No AMF-linked investor candidates (or all excluded as parties).</p>
        : null}
      </div>
    </div>
  );
}
