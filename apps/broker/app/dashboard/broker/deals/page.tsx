"use client";

import { useCallback, useEffect, useState } from "react";

import { TurboDraftList } from "@/components/turbo-draft/TurboDraftList";

type DealRow = {
  id: string;
  address: string;
  askingPriceCents: number | null;
  estimatedValueCents: number | null;
  capRate: number | null;
  dealScore: number | null;
  dealLabel: string | null;
  dealType: string | null;
  lowConfidence: boolean;
  aiSummary: string | null;
};

function money(cents: number | null | undefined) {
  if (cents == null || !Number.isFinite(cents)) return "—";
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadDeals = useCallback(async () => {
    const r = await fetch("/api/deal/list");
    if (!r.ok) {
      setMessage("Could not load deals (sign in as a monitored user).");
      return;
    }
    const d = (await r.json()) as { items?: DealRow[] };
    setDeals(d.items ?? []);
    setMessage(null);
  }, []);

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  async function runScan() {
    setLoading(true);
    setMessage(null);
    try {
      const gen = await fetch("/api/deal/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!gen.ok) {
        const err = (await gen.json().catch(() => ({}))) as { error?: string };
        setMessage(err.error ?? `Generate failed (${gen.status}).`);
        setLoading(false);
        return;
      }
      await fetch("/api/deal/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 15 }),
      });
      await loadDeals();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl text-[#D4AF37]">Active Turbo Drafts</h1>
        <p className="text-white/60 mt-1 mb-4">
          Review and finalize compliant drafts from listing inquiries.
        </p>
        <TurboDraftList role="BROKER" />
      </div>

      <div>
        <h1 className="text-3xl text-[#D4AF37]">AI Deal Finder</h1>
        <p className="text-white/60 mt-1 max-w-2xl">
          Scores governed FSBO inventory for underwriting-style signals. Advisory only — not a solicitation or purchase instruction. Requires{" "}
          <code className="text-white/80">LECIPM_DEAL_FINDER_DATA_LAYER=true</code>.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void runScan()}
          disabled={loading}
          className="px-4 py-3 rounded-xl bg-[#D4AF37] text-black font-semibold disabled:opacity-50"
        >
          {loading ? "Scanning…" : "Run deal scan + AI summaries"}
        </button>
        <button
          type="button"
          onClick={() => void loadDeals()}
          className="px-4 py-3 rounded-xl border border-white/20 text-white/90"
        >
          Refresh list
        </button>
      </div>

      {message ? <p className="text-amber-200/90 text-sm">{message}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {deals.map((d) => (
          <div key={d.id} className="border border-white/10 rounded-2xl p-4 bg-black/40 space-y-2">
            <h3 className="text-[#D4AF37] font-semibold leading-snug">{d.address}</h3>

            <p className="text-sm text-white/80">Price: {money(d.askingPriceCents)}</p>
            <p className="text-sm text-white/80">Est. value: {money(d.estimatedValueCents)}</p>
            <p className="text-sm text-white/80">
              Cap rate: {d.capRate != null && Number.isFinite(d.capRate) ? `${(d.capRate * 100).toFixed(2)}%` : "—"}
            </p>
            <p className="text-sm text-white/80">Score: {d.dealScore != null ? Math.round(d.dealScore) : "—"}</p>

            {d.lowConfidence ? (
              <p className="text-xs text-amber-200/90">Low confidence — heuristic rent/value; verify with appraisal and leases.</p>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-lg bg-[#D4AF37] text-black text-xs font-medium">{d.dealLabel ?? d.dealType ?? "deal"}</span>
            </div>

            {d.aiSummary ? <p className="mt-3 text-xs text-white/65 whitespace-pre-wrap">{d.aiSummary}</p> : null}
          </div>
        ))}
      </div>

      {deals.length === 0 && !message ? (
        <p className="text-white/50 text-sm">No deal candidates yet. Run a scan after enabling the data-layer flag.</p>
      ) : null}
    </div>
  );
}
