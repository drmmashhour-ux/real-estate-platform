"use client";

import { useState } from "react";

type ListingSummary = {
  id: string;
  title: string | null;
  address: string | null;
  city: string | null;
  listingStatus: string;
  cadastreNumber: string | null;
  ownerId?: string;
};

type HighRiskItem = {
  id: string;
  fraudScore: number;
  riskLevel: string;
  reasons: unknown;
  listing: ListingSummary;
};

type DuplicateCadastreItem = {
  id: string;
  listingId: string;
  alertType: string;
  severity: string;
  message: string;
  status: string;
  listing: ListingSummary;
  createdAt: Date | string;
};

type BrokerItem = {
  brokerId: string;
  listingCount: number;
  fraudFlags: number;
  riskScore: number;
  broker: { id: string; name: string | null; email: string } | null;
  updatedAt: Date | string;
};

type UnderInvestigationItem = {
  id: string;
  title: string | null;
  address: string | null;
  city: string | null;
  listingStatus: string;
  cadastreNumber: string | null;
  ownerId: string;
  propertyFraudScores: Array<{ fraudScore: number; riskLevel: string }>;
};

type Props = {
  highRiskListings: HighRiskItem[];
  duplicateCadastreAlerts: DuplicateCadastreItem[];
  suspiciousBrokers: BrokerItem[];
  underInvestigationListings: UnderInvestigationItem[];
};

export function AntiFraudDashboardClient({
  highRiskListings,
  duplicateCadastreAlerts,
  suspiciousBrokers,
  underInvestigationListings,
}: Props) {
  const [actioning, setActioning] = useState<Record<string, boolean>>({});

  async function listingAction(listingId: string, action: string, extra?: Record<string, unknown>) {
    setActioning((prev) => ({ ...prev, [listingId]: true }));
    try {
      const res = await fetch(`/api/admin/fraud/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) window.location.reload();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Action failed");
      }
    } finally {
      setActioning((prev) => ({ ...prev, [listingId]: false }));
    }
  }

  return (
    <div className="mt-8 space-y-10">
      {/* Under investigation */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200">Under investigation</h2>
        <p className="mt-1 text-sm text-slate-500">Listings frozen (fraud score &gt; 70). Review before publication.</p>
        {underInvestigationListings.length === 0 ? (
          <p className="mt-4 text-slate-500">None.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {underInvestigationListings.map((l) => (
              <li key={l.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-100">{l.title || l.id}</p>
                    <p className="text-sm text-slate-400">{l.address}, {l.city} · Cadastre: {l.cadastreNumber || "—"}</p>
                    {l.propertyFraudScores[0] && (
                      <p className="mt-1 text-sm text-amber-400">Score: {l.propertyFraudScores[0].fraudScore} ({l.propertyFraudScores[0].riskLevel})</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => listingAction(l.id, "approve", { publish: false })}
                      disabled={!!actioning[l.id]}
                      className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Approve (draft)
                    </button>
                    <button
                      type="button"
                      onClick={() => listingAction(l.id, "approve", { publish: true })}
                      disabled={!!actioning[l.id]}
                      className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                    >
                      Approve & publish
                    </button>
                    <button
                      type="button"
                      onClick={() => listingAction(l.id, "reject")}
                      disabled={!!actioning[l.id]}
                      className="rounded-lg border border-red-800 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/30 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => window.confirm("Permanently ban this host and remove the listing?") && listingAction(l.id, "ban_host")}
                      disabled={!!actioning[l.id]}
                      className="rounded-lg bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/50 disabled:opacity-50"
                    >
                      Ban host
                    </button>
                    <button
                      type="button"
                      onClick={() => listingAction(l.id, "request_documents", { reason: "Please submit additional documents for fraud review." })}
                      disabled={!!actioning[l.id]}
                      className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-400 disabled:opacity-50"
                    >
                      Request documents
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* High-risk listings */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200">High-risk listings</h2>
        <p className="mt-1 text-sm text-slate-500">Score ≥ 60 or risk level high.</p>
        {highRiskListings.length === 0 ? (
          <p className="mt-4 text-slate-500">None.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {highRiskListings.map((s) => (
              <li key={s.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-100">{s.listing.title || s.listing.id}</p>
                    <p className="text-sm text-slate-400">{s.listing.address}, {s.listing.city} · {s.listing.listingStatus}</p>
                    <p className="mt-1 text-sm text-amber-400">Score: {s.fraudScore} ({s.riskLevel})</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => listingAction(s.listing.id, "freeze")}
                      disabled={!!actioning[s.listing.id]}
                      className="rounded-lg border border-amber-700 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-900/30 disabled:opacity-50"
                    >
                      Freeze
                    </button>
                    <button
                      type="button"
                      onClick={() => listingAction(s.listing.id, "request_documents")}
                      disabled={!!actioning[s.listing.id]}
                      className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-400 disabled:opacity-50"
                    >
                      Request documents
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Duplicate cadastre */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200">Duplicate cadastre alerts</h2>
        <p className="mt-1 text-sm text-slate-500">Same cadastre number used elsewhere.</p>
        {duplicateCadastreAlerts.length === 0 ? (
          <p className="mt-4 text-slate-500">None.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {duplicateCadastreAlerts.map((a) => (
              <li key={a.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="font-medium text-slate-100">{a.listing?.title || a.listingId}</p>
                <p className="text-sm text-slate-400">{a.listing?.address}, {a.listing?.city} · Cadastre: {a.listing?.cadastreNumber}</p>
                <p className="mt-1 text-sm text-amber-400">{a.message}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => listingAction(a.listingId, "freeze")}
                    disabled={!!actioning[a.listingId]}
                    className="rounded-lg border border-amber-700 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-900/30 disabled:opacity-50"
                  >
                    Freeze listing
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Suspicious brokers */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200">Suspicious brokers</h2>
        <p className="mt-1 text-sm text-slate-500">Broker activity risk scores.</p>
        {suspiciousBrokers.length === 0 ? (
          <p className="mt-4 text-slate-500">None.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {suspiciousBrokers.map((b) => (
              <li key={b.brokerId} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="font-medium text-slate-100">{b.broker?.name || b.broker?.email || b.brokerId}</p>
                <p className="text-sm text-slate-400">{b.broker?.email} · Listings: {b.listingCount} · Flags: {b.fraudFlags}</p>
                <p className="mt-1 text-sm text-amber-400">Risk score: {b.riskScore}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
