"use client";

import { useCallback, useEffect, useState } from "react";
import { CoOwnershipChecklist } from "./CoOwnershipChecklist";

type Row = {
  id: string;
  listingCode?: string;
  title?: string;
  listingType?: string;
  isCoOwnership?: boolean;
};

/**
 * Loads broker-accessible CRM listings and renders co-ownership compliance for CONDO / co-ownership rows.
 */
export function CoOwnershipBrokerCondoPanel({ className = "" }: { className?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/broker/listings", { credentials: "same-origin" });
      const data = await res.json().catch(() => []);
      const list = Array.isArray(data) ? data : [];
      const filtered = list.filter(
        (r: Row) => String(r.listingType ?? "").toUpperCase() === "CONDO" || r.isCoOwnership === true
      );
      setRows(filtered.slice(0, 6));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <section className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`}>
        <p className="text-sm text-slate-400">Loading co-ownership listings…</p>
      </section>
    );
  }

  if (rows.length === 0) return null;

  return (
    <section className={`rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5 ${className}`}>
      <p className="section-title mb-1 text-amber-200/90">Québec Reg. 2025</p>
      <h2 className="text-xl font-semibold tracking-tight text-white">Co-ownership compliance</h2>
      <p className="mt-1 text-sm text-slate-300">
        Review checklist items for divided co-ownership listings in your workspace.
      </p>
      <div className="mt-6 space-y-8">
        {rows.map((r) => (
          <div key={r.id}>
            <p className="mb-3 font-mono text-xs text-slate-400">
              {(r.listingCode ?? r.id).toString()}
              {r.title ? ` · ${r.title}` : ""}
            </p>
            <CoOwnershipChecklist listingId={r.id} showRegulationBanner={false} />
          </div>
        ))}
      </div>
    </section>
  );
}
