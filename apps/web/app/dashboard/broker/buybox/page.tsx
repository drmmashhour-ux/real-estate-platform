"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type MatchRow = {
  id: string;
  listingId: string | null;
  matchScore: number;
  matchLabel: string | null;
  aiSummary: string | null;
};

export default function AiBuyBoxEnginePage() {
  const [buyBoxId, setBuyBoxId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadMatches = useCallback(async (id: string) => {
    const listed = await fetch("/api/buybox/matches/list", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyBoxId: id, take: 50 }),
    }).then((r) => r.json());
    if (listed.success) {
      setMatches((listed.items ?? []) as MatchRow[]);
    }
  }, []);

  async function createDemoBuyBox() {
    setBusy(true);
    setMessage(null);
    try {
      const created = await fetch("/api/buybox/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Growth + cashflow Laval multi-unit",
          city: "Laval",
          province: "QC",
          propertyType: "multi_unit",
          minPriceCents: 40_000_000,
          maxPriceCents: 90_000_000,
          minCapRate: 0.05,
          minROI: 0.05,
          minCashflowCents: 50_000,
          minDSCR: 1.2,
          maxRiskScore: 60,
          requiredZone: "growth",
          strategyType: "balanced",
        }),
      }).then((r) => r.json());

      if (!created.success) {
        setMessage(created.error ?? "Create failed");
        return;
      }

      const id = created.item.id as string;
      setBuyBoxId(id);

      const run = await fetch("/api/buybox/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyBoxId: id }),
      }).then((r) => r.json());

      if (!run.success) {
        setMessage(
          run.error === "DATA_SOURCE_REQUIRED" ?
            "Set LECIPM_BUY_BOX_DATA_LAYER=true to scan approved FSBO inventory."
          : (run.error ?? "Run failed"),
        );
        await loadMatches(id);
        return;
      }

      await fetch("/api/buybox/summarize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyBoxId: id, take: 15 }),
      }).then((r) => r.json());

      await loadMatches(id);
      setMessage("Demo complete — review matches and Alert Center for strong fits (advisory only).");
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  const chartData = matches.slice(0, 12).map((m) => ({
    name: (m.listingId ?? m.id).slice(0, 8),
    score: Math.round(m.matchScore),
  }));

  return (
    <div className="min-h-screen space-y-6 bg-zinc-950 p-6 text-white">
      <div>
        <h1 className="text-3xl font-bold text-[#D4AF37]">AI Buy Box Engine</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Define strategy, scan approved marketplace inventory, rank matches, and review AI fit notes. Discovery only —
          no autonomous purchasing.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/dashboard/broker/buy-box" className="text-[#D4AF37] underline-offset-4 hover:underline">
            Buy box hub
          </Link>
          <Link href="/dashboard/broker/alerts" className="text-[#D4AF37] underline-offset-4 hover:underline">
            Alert Center
          </Link>
          <Link href="/dashboard/broker/saved-searches" className="text-[#D4AF37] underline-offset-4 hover:underline">
            Saved searches
          </Link>
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void createDemoBuyBox()}
        className="rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
      >
        Run demo buy box
      </button>

      {buyBoxId ? (
        <p className="text-xs text-white/45">
          Active buy box id: <span className="text-white/70">{buyBoxId}</span>
        </p>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white/80">{message}</div>
      ) : null}

      {matches.length > 0 && (
        <>
          <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
            <div className="mb-3 text-lg text-[#D4AF37]">Top match scores</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#666" fontSize={11} />
                <YAxis stroke="#666" fontSize={11} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                <Bar dataKey="score" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {matches.map((match) => (
              <div key={match.id} className="rounded-2xl border border-white/10 bg-black/50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-[#D4AF37]">{match.matchLabel ?? "match"}</div>
                  <div className="text-sm text-white/60">Score: {Math.round(match.matchScore)}</div>
                </div>
                <div className="mt-1 text-xs text-white/45">Listing: {match.listingId ?? "—"}</div>
                <div className="mt-3 text-sm leading-relaxed text-white/70">
                  {match.aiSummary ?? "No AI summary yet — run summarize after matches exist."}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
