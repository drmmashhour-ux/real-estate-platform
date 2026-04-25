"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type CaseRow = {
  id: string;
  caseNumber: string;
  complaintType: string;
  severity: string;
  status: string;
  routingDecision: string | null;
};

type Counts = {
  new: number;
  in_review: number;
  public_assistance: number;
  syndic: number;
};

export default function ComplaintsDashboardPage() {
  const [agencyId, setAgencyId] = useState("");
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const qs = agencyId.trim() ? `?agencyId=${encodeURIComponent(agencyId.trim())}` : "";
      const res = await fetch(`/api/complaints/list${qs}`, { credentials: "same-origin" });
      const data = (await res.json()) as {
        success?: boolean;
        cases?: CaseRow[];
        counts?: Counts;
        error?: string;
      };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to load");
        setCases([]);
        setCounts(null);
        return;
      }
      setCases(data.cases ?? []);
      setCounts(data.counts ?? null);
    } catch {
      setError("Network error");
      setCases([]);
      setCounts(null);
    }
  }, [agencyId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#D4AF37]">Complaints &amp; Public Protection</h1>
        <p className="text-sm text-gray-400 mt-2">
          Track complaints, consumer assistance requests, compliance escalations, syndic-oriented referrals, and audit
          events. Final routing remains with accountable human review.
        </p>
        {error ? <p className="mt-2 text-sm text-amber-400">{error}</p> : null}
      </div>

      <label className="flex flex-col gap-1 text-xs text-gray-500 max-w-md">
        Agency id (optional)
        <input
          className="bg-black text-white border border-gray-700 p-2 font-mono text-sm"
          placeholder="Leave blank for solo broker scope"
          value={agencyId}
          onChange={(e) => setAgencyId(e.target.value)}
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#D4AF37]/30 bg-black p-4 text-white">
          <div className="text-sm text-gray-400">New complaints</div>
          <div className="text-2xl font-bold mt-2">{counts?.new ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/30 bg-black p-4 text-white">
          <div className="text-sm text-gray-400">In review / triaged</div>
          <div className="text-2xl font-bold mt-2">{counts?.in_review ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/30 bg-black p-4 text-white">
          <div className="text-sm text-gray-400">Public assistance</div>
          <div className="text-2xl font-bold mt-2">{counts?.public_assistance ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/30 bg-black p-4 text-white">
          <div className="text-sm text-gray-400">Syndic candidates</div>
          <div className="text-2xl font-bold mt-2">{counts?.syndic ?? "—"}</div>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Link
          href="/dashboard/broker/complaints/new"
          className="px-4 py-2 bg-[#D4AF37] text-black font-semibold rounded"
        >
          New complaint
        </Link>
        <button type="button" onClick={() => void load()} className="text-sm text-gray-400 underline">
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-[#D4AF37]/20 bg-black p-5">
        <h2 className="text-lg font-semibold text-white">Cases</h2>

        <div className="mt-4 space-y-3">
          {cases.length === 0 ? (
            <p className="text-sm text-gray-500">No cases in this scope yet.</p>
          ) : (
            cases.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-white/10 p-4 text-white flex items-center justify-between gap-4 flex-wrap"
              >
                <div>
                  <div className="font-medium font-mono">{c.caseNumber}</div>
                  <div className="text-sm text-gray-400">
                    {c.complaintType} · {c.severity}
                    {c.routingDecision ? ` · ${c.routingDecision}` : ""}
                  </div>
                </div>
                <div className="text-sm uppercase text-[#D4AF37]">{c.status.replace(/_/g, " ")}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
