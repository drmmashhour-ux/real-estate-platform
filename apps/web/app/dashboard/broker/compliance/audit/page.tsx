"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AuditRow = {
  id: string;
  auditNumber: string;
  moduleKey: string;
  entityType: string;
  actionType: string;
  severity: string;
  summary: string;
  eventTimestamp: string;
};

export default function ComplianceAuditPage() {
  const [records, setRecords] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/compliance/audit/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ take: 100 }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        records?: AuditRow[];
        error?: string;
      };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to load audit trail");
        setRecords([]);
        return;
      }
      setRecords(data.records ?? []);
    } catch {
      setError("Network error");
      setRecords([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#D4AF37]">Compliance audit trail</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Unified chronology of compliance-relevant actions (declarations, contracts, trust, financials, complaints,
            assistance). Records are append-only with content hashes for review and export.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void load()}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 disabled:opacity-50"
          >
            {busy ? "Refreshing…" : "Refresh"}
          </button>
          <Link
            href="/dashboard/broker/compliance/supervision"
            className="rounded-lg border border-sky-500/40 px-4 py-2 text-sm font-medium text-sky-200 hover:bg-sky-950/40"
          >
            Authorization &amp; supervision
          </Link>
          <Link
            href="/dashboard/broker/compliance/retention"
            className="rounded-lg border border-amber-500/35 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-950/35"
          >
            Retention &amp; legal hold
          </Link>
          <Link
            href="/dashboard/broker/compliance/health"
            className="rounded-lg border border-emerald-500/40 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-900/30"
          >
            Compliance health
          </Link>
          <Link
            href="/dashboard/broker/compliance/review-queue"
            className="rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            Review queue
          </Link>
          <Link
            href="/dashboard/broker/compliance/inspection"
            className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black"
          >
            Inspection &amp; bundles
          </Link>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</p>
      ) : null}

      <div className="rounded-xl border border-[#D4AF37]/20 bg-black/40 p-5">
        <h2 className="text-lg font-semibold text-white">Recent audit records</h2>
        {records.length === 0 && !busy ? (
          <p className="mt-4 text-sm text-white/50">No records yet for your scope — actions will appear as modules emit audit events.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {records.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-mono text-sm font-medium text-white">{item.auditNumber}</div>
                  <div className="text-sm text-white/55">
                    {item.moduleKey} · {item.entityType} · {item.actionType}
                  </div>
                  <div className="mt-1 text-xs text-white/45">{item.summary}</div>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                  <span className="text-xs uppercase tracking-wide text-[#D4AF37]">{item.severity}</span>
                  <span className="text-xs text-white/40">{item.eventTimestamp?.slice(0, 19) ?? "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
