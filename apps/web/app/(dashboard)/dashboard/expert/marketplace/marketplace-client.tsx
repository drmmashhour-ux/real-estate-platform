"use client";

import { useCallback, useEffect, useState } from "react";

type PoolLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  mortgageInquiry: unknown;
  revenueTier: string | null;
  mortgageCreditCost: number;
  dynamicLeadPriceCents: number | null;
  purchaseRegion: string | null;
};

export function ExpertMarketplaceClient() {
  const [leads, setLeads] = useState<PoolLead[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/mortgage/expert/marketplace", { credentials: "same-origin" });
    if (!res.ok) {
      setErr("Could not load marketplace.");
      return;
    }
    const j = (await res.json()) as { leads: PoolLead[] };
    setLeads(j.leads);
    setErr("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function claim(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/mortgage/expert/marketplace/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ leadId: id }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        alert(j.error ?? "Could not claim");
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (err) return <p className="mt-8 text-red-400">{err}</p>;
  if (!leads) return <p className="mt-8 text-[#B3B3B3]">Loading…</p>;
  if (leads.length === 0) {
    return <p className="mt-8 text-[#737373]">No open marketplace leads. Auto-assignment may have covered all volume.</p>;
  }

  return (
    <ul className="mt-8 space-y-4">
      {leads.map((l) => {
        const inq = l.mortgageInquiry as Record<string, unknown> | null;
        return (
          <li key={l.id} className="rounded-2xl border border-amber-500/30 bg-[#121212] p-5 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-white">{l.name}</p>
                <p className="text-[#B3B3B3]">{l.email}</p>
                <p className="text-[#737373]">{l.phone}</p>
                {inq?.purchasePrice != null ? (
                  <p className="mt-2 text-xs text-amber-200/80">
                    Est. price: ${Number(inq.purchasePrice).toLocaleString()}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide text-amber-100/90">
                  {l.revenueTier ? (
                    <span className="rounded border border-amber-400/40 px-2 py-0.5">Tier {l.revenueTier}</span>
                  ) : null}
                  <span className="rounded border border-amber-400/40 px-2 py-0.5">
                    Credit cost: {l.mortgageCreditCost}
                  </span>
                  {l.revenueTier === "HIGH" ? (
                    <span className="rounded border border-red-400/50 px-2 py-0.5 text-red-200">Premium only</span>
                  ) : null}
                  {l.purchaseRegion ? <span className="text-[#B3B3B3]">{l.purchaseRegion}</span> : null}
                </div>
              </div>
              <button
                type="button"
                disabled={busy === l.id}
                onClick={() => void claim(l.id)}
                className="rounded-xl border border-amber-400 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-amber-400/10 disabled:opacity-50"
              >
                {busy === l.id ? "Claiming…" : "Claim lead"}
              </button>
            </div>
            <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-xs text-[#9CA3AF]">
              {l.message}
            </pre>
          </li>
        );
      })}
    </ul>
  );
}
