"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { InsuranceLeadStatus, InsuranceLeadType, InsuranceLeadSource } from "@prisma/client";
import { InsuranceLeadStatus as ILS } from "@prisma/client";
import { insuranceStatusUiLabel } from "@/lib/insurance/hub-status-labels";

type LeadRow = {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  leadType: InsuranceLeadType;
  listingId: string | null;
  bookingId: string | null;
  source: InsuranceLeadSource;
  status: InsuranceLeadStatus;
  estimatedValue: unknown;
  createdAt: string;
  assignedBrokerUserId: string | null;
};

type Kpis = {
  newLeads: number;
  quotesSent: number;
  policiesClosed: number;
  conversionRatePct: number;
  conversionNote: string;
};

function formatMoneyCad(v: unknown): string {
  if (v == null) return "—";
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function propertyTypeLabel(lead: LeadRow): string {
  if (lead.leadType === "PROPERTY") return "Residential";
  if (lead.leadType === "TRAVEL") return "Travel / short stay";
  return lead.leadType;
}

const STATUS_OPTIONS: InsuranceLeadStatus[] = [
  ILS.NEW,
  ILS.CONTACTED,
  ILS.SENT,
  ILS.CONVERTED,
  ILS.REJECTED,
];

export function InsuranceDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/dashboard/insurance/leads", { credentials: "same-origin" });
      const j = (await r.json()) as {
        ok?: boolean;
        error?: string;
        leads?: LeadRow[];
        kpis?: Kpis;
      };
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Could not load leads");
      setLeads(Array.isArray(j.leads) ? j.leads : []);
      setKpis(j.kpis ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
      setLeads([]);
      setKpis(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchStatus(id: string, status: InsuranceLeadStatus) {
    setBusyId(id);
    setError(null);
    try {
      const r = await fetch(`/api/dashboard/insurance/leads/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Update failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  const aiLines = useMemo(() => {
    const nNew = leads.filter((l) => l.status === "NEW").length;
    const high = leads.filter((l) => l.estimatedValue != null).length;
    const lines: string[] = [];
    if (nNew > 0) lines.push(`Follow up with ${nNew} new lead${nNew === 1 ? "" : "s"}`);
    if (high > 0) lines.push("Prioritize leads with an estimated value on file — quotes may move faster.");
    lines.push("Client likely to convert when response time is under 24h and phone is present.");
    return lines.slice(0, 4);
  }, [leads]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-gold/90">Insurance</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Insurance Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Manage leads, quotes, and policies</p>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">{error}</p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "New Leads", value: kpis?.newLeads ?? "—", hint: "Awaiting first touch" },
          { label: "Quotes Sent", value: kpis?.quotesSent ?? "—", hint: "Outreach / quote step" },
          { label: "Policies Closed", value: kpis?.policiesClosed ?? "—", hint: "Marked won in CRM" },
          {
            label: "Conversion Rate",
            value: kpis ? `${kpis.conversionRatePct}%` : "—",
            hint: kpis?.conversionNote ?? "Pipeline snapshot",
          },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">{k.label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{loading ? "…" : k.value}</p>
            <p className="mt-1 text-xs text-slate-500">{k.hint}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <section id="insurance-leads-table" className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Leads</h2>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading…</p>
          ) : leads.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center">
              <p className="text-sm text-slate-400">Your insurance leads will appear here</p>
              <Link
                href="/listings"
                className="mt-4 inline-flex rounded-full bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Explore listings to find clients
              </Link>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[720px] w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="border-b border-white/10 pb-2 pr-3 font-medium">Client</th>
                    <th className="border-b border-white/10 pb-2 pr-3 font-medium">Property type</th>
                    <th className="border-b border-white/10 pb-2 pr-3 font-medium">Est. value</th>
                    <th className="border-b border-white/10 pb-2 pr-3 font-medium">Status</th>
                    <th className="border-b border-white/10 pb-2 pr-3 font-medium">Created</th>
                    <th className="border-b border-white/10 pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const name = lead.fullName?.trim() || lead.email;
                    const created = new Date(lead.createdAt).toLocaleDateString();
                    const busy = busyId === lead.id;
                    return (
                      <tr key={lead.id} className="text-slate-200">
                        <td className="border-b border-white/5 py-3 pr-3 align-top">
                          <span className="font-medium text-white">{name}</span>
                          <p className="text-xs text-slate-500">{lead.email}</p>
                        </td>
                        <td className="border-b border-white/5 py-3 pr-3 align-top text-slate-300">
                          {propertyTypeLabel(lead)}
                        </td>
                        <td className="border-b border-white/5 py-3 pr-3 align-top">{formatMoneyCad(lead.estimatedValue)}</td>
                        <td className="border-b border-white/5 py-3 pr-3 align-top">
                          <select
                            className="max-w-[170px] rounded-lg border border-white/15 bg-slate-950/80 px-2 py-1 text-xs text-white outline-none focus:border-premium-gold/50"
                            value={lead.status}
                            disabled={busy}
                            onChange={(e) => void patchStatus(lead.id, e.target.value as InsuranceLeadStatus)}
                            aria-label={`Status for ${name}`}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {insuranceStatusUiLabel(s)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border-b border-white/5 py-3 pr-3 align-top text-slate-400">{created}</td>
                        <td className="border-b border-white/5 py-3 align-top text-right">
                          <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-2">
                            <Link
                              href={
                                lead.listingId
                                  ? `/listings/${lead.listingId}`
                                  : lead.bookingId
                                    ? `/bnhub/booking/${lead.bookingId}`
                                    : "/listings"
                              }
                              className="rounded-lg border border-white/15 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                            >
                              View
                            </Link>
                            <a
                              href={`mailto:${encodeURIComponent(lead.email)}`}
                              className="rounded-lg border border-white/15 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                            >
                              Contact
                            </a>
                            <button
                              type="button"
                              disabled={busy || lead.status !== "NEW"}
                              onClick={() => void patchStatus(lead.id, ILS.CONTACTED)}
                              className="rounded-lg border border-amber-500/35 px-2 py-1 text-xs text-amber-100 hover:bg-amber-950/40 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Mark contacted
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Quick actions</h2>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="rounded-xl bg-premium-gold px-4 py-3 text-sm font-semibold text-black transition hover:brightness-110"
                onClick={() => {
                  const el = document.getElementById("insurance-leads-table");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Create insurance quote
              </button>
              <p className="text-[11px] text-slate-500">
                Use Contact on a lead, then mark <span className="text-slate-400">Quoted</span> when materials are sent.
              </p>
              <button
                type="button"
                className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5"
                onClick={() => {
                  const first = leads.find((l) => l.status === "NEW");
                  if (first) window.location.href = `mailto:${encodeURIComponent(first.email)}`;
                }}
              >
                Contact new leads
              </button>
              <Link
                href="/dashboard/leads"
                className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-white/5"
              >
                View all clients
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">AI Recommendations</h2>
            <p className="mt-1 text-xs text-slate-500">Heuristic suggestions — not underwriting advice.</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {aiLines.map((line) => (
                <li key={line} className="flex gap-2 rounded-lg border border-white/8 bg-slate-950/50 px-3 py-2">
                  <span className="text-premium-gold" aria-hidden>
                    •
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#0f0f0f] p-6">
            <h2 className="text-sm font-semibold text-white">Why insurance matters</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Protect your investment with tailored property insurance solutions. Use this desk to coordinate quotes and
              follow-up — coverage is issued only by licensed carriers after formal underwriting.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
