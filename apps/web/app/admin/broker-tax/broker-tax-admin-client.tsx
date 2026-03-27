"use client";

import { useCallback, useEffect, useState } from "react";

type Registration = {
  id: string;
  legalName: string;
  businessName: string | null;
  businessNumberNine: string;
  gstNumber: string | null;
  qstNumber: string | null;
  businessAddress: string;
  province: string;
  status: string;
  adminNotes: string | null;
  reviewedAt: string | null;
};

type BrokerRow = {
  id: string;
  email: string;
  name: string | null;
  brokerTaxRegistration: Registration | null;
};

export function BrokerTaxAdminClient() {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<BrokerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    sp.set("filter", filter);
    if (q.trim()) sp.set("q", q.trim());
    const res = await fetch(`/api/admin/broker-tax?${sp.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok) setRows(data.brokers ?? []);
    setLoading(false);
  }, [filter, q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(userId: string, action: "approve" | "reject") {
    const notes = notesDraft[userId] ?? "";
    const res = await fetch(`/api/admin/broker-tax/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNotes: notes || null }),
    });
    if (res.ok) void load();
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-100/90">
        Format validation only — you are performing a <strong>manual internal</strong> review. Do not represent this as verification with
        Revenu Québec or the CRA.
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-slate-500">Filter</label>
          <select className="input-premium mt-1" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All brokers</option>
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="missing">Missing / QC without QST</option>
            <option value="has_gst">Has GST on file</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500">Search</label>
          <input className="input-premium mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email / name" />
        </div>
        <button type="button" className="btn-primary text-sm" onClick={() => void load()}>
          Apply
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((b) => (
            <li key={b.id} className="card-premium p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-100">{b.email}</p>
                  <p className="text-xs text-slate-500">{b.name ?? "—"}</p>
                </div>
                {!b.brokerTaxRegistration && <span className="text-xs text-slate-500">Not submitted</span>}
              </div>
              {b.brokerTaxRegistration && (
                <div className="mt-3 space-y-2 border-t border-slate-800 pt-3 text-sm text-slate-400">
                  <p>
                    <span className="text-slate-500">Legal:</span> {b.brokerTaxRegistration.legalName}
                  </p>
                  {b.brokerTaxRegistration.businessName && (
                    <p>
                      <span className="text-slate-500">Business:</span> {b.brokerTaxRegistration.businessName}
                    </p>
                  )}
                  <p className="font-mono text-xs">
                    BN {b.brokerTaxRegistration.businessNumberNine}
                    {b.brokerTaxRegistration.gstNumber ? ` · GST ${b.brokerTaxRegistration.gstNumber}` : ""}
                    {b.brokerTaxRegistration.qstNumber ? ` · QST ${b.brokerTaxRegistration.qstNumber}` : ""}
                  </p>
                  <p className="text-xs">{b.brokerTaxRegistration.businessAddress}</p>
                  <p className="text-xs">
                    Province: {b.brokerTaxRegistration.province} · Status:{" "}
                    <span className="text-slate-200">{b.brokerTaxRegistration.status}</span>
                  </p>
                  <label className="block text-xs text-slate-500">Internal notes</label>
                  <textarea
                    className="input-premium mt-1 w-full text-sm"
                    rows={2}
                    value={notesDraft[b.id] ?? b.brokerTaxRegistration.adminNotes ?? ""}
                    onChange={(e) => setNotesDraft((d) => ({ ...d, [b.id]: e.target.value }))}
                    placeholder="Visible to staff; optional context for broker if rejected"
                  />
                  {b.brokerTaxRegistration.status === "SUBMITTED" && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button type="button" className="btn-primary text-xs" onClick={() => void review(b.id, "approve")}>
                        Approve (internal)
                      </button>
                      <button type="button" className="btn-secondary text-xs" onClick={() => void review(b.id, "reject")}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
