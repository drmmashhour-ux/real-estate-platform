"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

type Profile = {
  gstAccountNumberMasked: string | null;
  qstFileNumberMasked: string | null;
  neq: string | null;
  reportingFrequency: string | null;
  firstReturnDueAt: string | null;
  legalName: string | null;
} | null;

type TaxRow = {
  id: string;
  taxableBaseCents: number;
  gstCents: number;
  qstCents: number;
  totalWithTaxCents: number;
  reportingPeriodKey: string | null;
  reported: boolean;
  transactionRecord: { transactionType: string } | null;
};

export function AdminAgencyRevenuQuebecClient() {
  const [agencyId, setAgencyId] = useState("");
  const [reportingPeriodKey, setReportingPeriodKey] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [reportedFilter, setReportedFilter] = useState<"all" | "yes" | "no">("all");
  const [profile, setProfile] = useState<Profile>(null);
  const [taxes, setTaxes] = useState<TaxRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!agencyId.trim()) {
      setProfile(null);
      setTaxes([]);
      return;
    }
    setLoading(true);
    try {
      const base = {
        ownerType: "agency",
        ownerId: agencyId.trim(),
        ...(reportingPeriodKey.trim() ? { reportingPeriodKey: reportingPeriodKey.trim() } : {}),
        ...(transactionType.trim() ? { transactionType: transactionType.trim() } : {}),
        ...(reportedFilter === "yes" ? { reported: true } : {}),
        ...(reportedFilter === "no" ? { reported: false } : {}),
      };
      const [pRes, tRes] = await Promise.all([
        fetch("/api/financial/revenu-quebec-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerType: "agency", ownerId: agencyId.trim() }),
        }),
        fetch("/api/financial/taxes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(base),
        }),
      ]);
      const pJson = (await pRes.json()) as { profile?: Profile };
      const tJson = (await tRes.json()) as { data?: TaxRow[] };
      if (pRes.ok) setProfile(pJson.profile ?? null);
      if (tRes.ok) setTaxes(tJson.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [agencyId, reportingPeriodKey, transactionType, reportedFilter]);

  const monthlyTotals = taxes.reduce<Record<string, { base: number; gst: number; qst: number; count: number }>>(
    (acc, row) => {
      const k = row.reportingPeriodKey ?? "—";
      if (!acc[k]) acc[k] = { base: 0, gst: 0, qst: 0, count: 0 };
      acc[k].base += row.taxableBaseCents;
      acc[k].gst += row.gstCents;
      acc[k].qst += row.qstCents;
      acc[k].count += 1;
      return acc;
    },
    {},
  );

  const unreported = taxes.filter((t) => !t.reported).length;

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#D4AF37]">Agency tax records</h1>
        <Link href="/admin/dashboard" className="text-sm text-[#D4AF37] hover:underline">
          ← Admin
        </Link>
      </div>

      <p className="max-w-3xl text-sm text-white/60">
        Oversight view: masked identifiers only. Use filters for reporting period, underlying transaction type, and
        reported status.
      </p>

      <div className="flex flex-wrap gap-3">
        <input
          className="min-w-[240px] rounded-lg border border-white/15 bg-black px-3 py-2 text-sm"
          placeholder="Agency / office owner id"
          value={agencyId}
          onChange={(e) => setAgencyId(e.target.value)}
        />
        <input
          className="min-w-[120px] rounded-lg border border-white/15 bg-black px-3 py-2 text-sm"
          placeholder="Period YYYY-MM"
          value={reportingPeriodKey}
          onChange={(e) => setReportingPeriodKey(e.target.value)}
        />
        <input
          className="min-w-[160px] rounded-lg border border-white/15 bg-black px-3 py-2 text-sm"
          placeholder="Transaction type"
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
        />
        <select
          className="rounded-lg border border-white/15 bg-black px-3 py-2 text-sm"
          value={reportedFilter}
          onChange={(e) => setReportedFilter(e.target.value as "all" | "yes" | "no")}
        >
          <option value="all">All reported states</option>
          <option value="no">Unreported only</option>
          <option value="yes">Reported only</option>
        </select>
        <button
          type="button"
          className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
          disabled={!agencyId.trim() || loading}
          onClick={() => void load()}
        >
          Load
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-black p-4 text-sm space-y-1">
        <div>
          Legal name: <span className="text-white">{profile?.legalName ?? "—"}</span>
        </div>
        <div>
          GST (masked): <span className="text-white">{profile?.gstAccountNumberMasked ?? "—"}</span>
        </div>
        <div>
          QST (masked): <span className="text-white">{profile?.qstFileNumberMasked ?? "—"}</span>
        </div>
        <div>
          NEQ: <span className="text-white">{profile?.neq ?? "—"}</span>
        </div>
        <div>
          Reporting: <span className="text-white">{profile?.reportingFrequency ?? "—"}</span>
        </div>
        <div>
          Unreported rows in view: <span className="text-white">{unreported}</span>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-[#D4AF37]">Monthly grouped totals</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(monthlyTotals).map(([period, v]) => (
            <div key={period} className="rounded-xl border border-white/10 bg-black/50 p-3 text-sm">
              <p className="font-medium text-white">{period}</p>
              <p className="text-white/70">Rows: {v.count}</p>
              <p className="text-white/70">Base: {(v.base / 100).toFixed(2)}</p>
              <p className="text-white/70">GST: {(v.gst / 100).toFixed(2)}</p>
              <p className="text-white/70">QST: {(v.qst / 100).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#D4AF37]">Tax ledger</h2>
        {taxes.map((row) => (
          <div key={row.id} className="rounded-xl border border-white/10 bg-black p-4 text-sm space-y-1">
            <div>Type: {row.transactionRecord?.transactionType ?? "—"}</div>
            <div>Base: {(row.taxableBaseCents / 100).toFixed(2)}</div>
            <div>GST: {(row.gstCents / 100).toFixed(2)}</div>
            <div>QST: {(row.qstCents / 100).toFixed(2)}</div>
            <div>Total: {(row.totalWithTaxCents / 100).toFixed(2)}</div>
            <div>Period: {row.reportingPeriodKey ?? "—"}</div>
            <div>Reported: {row.reported ? "yes" : "no"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
