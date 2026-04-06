"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LeadRow = {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  leadType: string;
  listingId: string | null;
  bookingId: string | null;
  source: string;
  status: string;
  estimatedValue: string | null;
  leadScore: number;
  variantId: string | null;
  createdAt: string;
  partner: {
    id: string;
    name: string;
    contactEmail: string;
    fixedPricePerLead: string;
    basePricePerLead: string | null;
    bonusHighQualityLead: string;
  } | null;
};

type ConversionStats = {
  windowDays: number;
  totalViews: number;
  totalStarts: number;
  totalSubmissions: number;
  totalFailures: number;
  viewToSubmitPct: number | null;
  startToSubmitPct: number | null;
};

type FunnelRow = { funnelSource: string; submissions: number };
type TypeRow = { leadType: string; count: number };

type Stats = { total: number; converted: number; revenueEstimate: number };

export function InsuranceLeadsAdminClient() {
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [conversionStats, setConversionStats] = useState<ConversionStats | null>(null);
  const [byFunnel, setByFunnel] = useState<FunnelRow[]>([]);
  const [byLeadType, setByLeadType] = useState<TypeRow[]>([]);
  const [topFunnelSource, setTopFunnelSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patching, setPatching] = useState<string | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("stats", "1");
    if (statusFilter) p.set("status", statusFilter);
    if (typeFilter) p.set("type", typeFilter);
    return `?${p.toString()}`;
  }, [statusFilter, typeFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/insurance/leads${qs}`, { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        leads?: LeadRow[];
        error?: string;
        conversionStats?: ConversionStats;
        submissionsByFunnelSource?: FunnelRow[];
        submissionsByLeadType?: TypeRow[];
        topFunnelSource?: string | null;
      };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to load leads.");
        setLeads([]);
        setConversionStats(null);
        return;
      }
      setLeads(Array.isArray(data.leads) ? data.leads : []);
      setConversionStats(data.conversionStats ?? null);
      setByFunnel(Array.isArray(data.submissionsByFunnelSource) ? data.submissionsByFunnelSource : []);
      setByLeadType(Array.isArray(data.submissionsByLeadType) ? data.submissionsByLeadType : []);
      setTopFunnelSource(data.topFunnelSource ?? null);
    } catch {
      setError("Network error.");
      setLeads([]);
      setConversionStats(null);
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats: Stats = useMemo(() => {
    const total = leads.length;
    let converted = 0;
    let revenueEstimate = 0;
    for (const l of leads) {
      if (l.status === "CONVERTED") {
        converted += 1;
        const v = l.estimatedValue != null ? Number(l.estimatedValue) : 0;
        if (!Number.isNaN(v)) revenueEstimate += v;
      }
    }
    return { total, converted, revenueEstimate };
  }, [leads]);

  async function patchStatus(id: string, status: "sent" | "converted" | "rejected") {
    setPatching(id);
    try {
      const res = await fetch(`/api/insurance/leads/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(typeof data.error === "string" ? data.error : "Update failed.");
        return;
      }
      await load();
    } finally {
      setPatching(null);
    }
  }

  const fmtPct = (v: number | null) =>
    v == null ? "—" : `${v >= 10 ? v.toFixed(1) : v.toFixed(2)}%`;

  return (
    <div className="space-y-8">
      {conversionStats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Form views ({conversionStats.windowDays}d)</p>
            <p className="mt-1 text-2xl font-bold text-white">{conversionStats.totalViews}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Submissions ({conversionStats.windowDays}d)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{conversionStats.totalSubmissions}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">View → submit</p>
            <p className="mt-1 text-2xl font-bold text-[#D4AF37]">{fmtPct(conversionStats.viewToSubmitPct)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Start → submit</p>
            <p className="mt-1 text-2xl font-bold text-sky-400">{fmtPct(conversionStats.startToSubmitPct)}</p>
          </div>
        </div>
      ) : null}

      {topFunnelSource ? (
        <p className="text-sm text-white/60">
          Top funnel source (30d submissions): <span className="font-semibold text-[#D4AF37]">{topFunnelSource}</span>
        </p>
      ) : null}

      {(byFunnel.length > 0 || byLeadType.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {byFunnel.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Submissions by source (30d)</p>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                {byFunnel.map((r) => (
                  <li key={r.funnelSource} className="flex justify-between gap-2">
                    <span>{r.funnelSource}</span>
                    <span className="font-mono text-[#D4AF37]">{r.submissions}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {byLeadType.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Submissions by type (30d)</p>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                {byLeadType.map((r) => (
                  <li key={r.leadType} className="flex justify-between gap-2">
                    <span>{r.leadType}</span>
                    <span className="font-mono text-[#D4AF37]">{r.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Leads (loaded)</p>
          <p className="mt-1 text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Converted</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{stats.converted}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Revenue estimate (CAD)</p>
          <p className="mt-1 text-2xl font-bold text-[#D4AF37]">
            ${stats.revenueEstimate.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-white/50">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 rounded-lg border border-white/15 bg-[#0b0b0b] px-3 py-2 text-sm text-white"
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="sent">Sent</option>
            <option value="converted">Converted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="mt-1 rounded-lg border border-white/15 bg-[#0b0b0b] px-3 py-2 text-sm text-white"
          >
            <option value="">All</option>
            <option value="travel">Travel</option>
            <option value="property">Property</option>
            <option value="mortgage">Mortgage</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          Refresh
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {loading ? <p className="text-sm text-white/50">Loading…</p> : null}

      {!loading && leads.length === 0 ? (
        <p className="text-sm text-white/50">No leads match these filters.</p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm text-white/80">
          <thead className="bg-[#0b0b0b] text-xs uppercase tracking-wide text-white/50">
            <tr>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Score</th>
              <th className="px-3 py-3">Var</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Partner</th>
              <th className="px-3 py-3">Context</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-[#050505]">
            {leads.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap px-3 py-2 text-xs">
                  {new Date(l.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2">{l.leadType}</td>
                <td className="px-3 py-2 font-mono text-xs">{l.leadScore}</td>
                <td className="px-3 py-2 font-mono text-xs">{l.variantId ?? "—"}</td>
                <td className="px-3 py-2">{l.status}</td>
                <td className="max-w-[200px] truncate px-3 py-2 font-mono text-xs">{l.email}</td>
                <td className="max-w-[160px] truncate px-3 py-2 text-xs">{l.partner?.name ?? "—"}</td>
                <td className="px-3 py-2 text-xs text-white/60">
                  {l.bookingId ? `booking ${l.bookingId.slice(0, 8)}…` : ""}
                  {l.listingId ? `${l.bookingId ? " · " : ""}listing ${l.listingId.slice(0, 8)}…` : !l.bookingId ? "—" : ""}
                </td>
                <td className="space-x-1 whitespace-nowrap px-3 py-2">
                  <button
                    type="button"
                    disabled={patching === l.id || l.status === "SENT"}
                    onClick={() => void patchStatus(l.id, "sent")}
                    className="rounded border border-white/20 px-2 py-1 text-xs text-white/80 hover:bg-white/5 disabled:opacity-40"
                  >
                    Sent
                  </button>
                  <button
                    type="button"
                    disabled={patching === l.id || l.status === "CONVERTED"}
                    onClick={() => void patchStatus(l.id, "converted")}
                    className="rounded border border-emerald-500/40 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
                  >
                    Won
                  </button>
                  <button
                    type="button"
                    disabled={patching === l.id || l.status === "REJECTED"}
                    onClick={() => void patchStatus(l.id, "rejected")}
                    className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
