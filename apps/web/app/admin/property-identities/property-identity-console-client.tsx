"use client";

import { useState } from "react";

type IdentityRow = {
  id: string;
  propertyUid: string;
  cadastreNumber: string | null;
  officialAddress: string;
  municipality: string | null;
  province: string | null;
  verificationScore: number | null;
  linkCount: number;
  risk: { riskLevel: string; riskScore: number } | null;
  updatedAt: Date;
};

type PendingLink = {
  id: string;
  listingId: string;
  listingType: string;
  linkStatus: string;
  propertyIdentityId: string;
  propertyUid: string;
  officialAddress: string;
  createdAt: Date;
};

type Props = {
  initialIdentities: IdentityRow[];
  pendingLinks: PendingLink[];
};

export function PropertyIdentityConsoleClient({ initialIdentities, pendingLinks }: Props) {
  const [identities, setIdentities] = useState(initialIdentities);
  const [pending, setPending] = useState(pendingLinks);
  const [cadastreSearch, setCadastreSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  async function search() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cadastreSearch.trim()) params.set("cadastre", cadastreSearch.trim());
      if (addressSearch.trim()) params.set("address", addressSearch.trim());
      const res = await fetch(`/api/admin/property-identities?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIdentities(data.property_identities || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: string) {
    setSelectedId(id);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/property-identities/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      } else setDetail(null);
    } finally {
      setLoading(false);
    }
  }

  async function approveLink(identityId: string, linkId: string) {
    setActioning(linkId);
    try {
      const res = await fetch(`/api/admin/property-identities/${identityId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_id: linkId }),
      });
      if (res.ok) {
        setPending((prev) => prev.filter((l) => l.id !== linkId));
        if (selectedId === identityId) loadDetail(identityId);
      }
    } finally {
      setActioning(null);
    }
  }

  async function rejectLink(identityId: string, linkId: string) {
    setActioning(linkId);
    try {
      const res = await fetch(`/api/admin/property-identities/${identityId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_id: linkId, reason: "Rejected by admin" }),
      });
      if (res.ok) {
        setPending((prev) => prev.filter((l) => l.id !== linkId));
        if (selectedId === identityId) loadDetail(identityId);
      }
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold text-slate-200">Search</h2>
        <div className="mt-2 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Cadastre number"
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
            value={cadastreSearch}
            onChange={(e) => setCadastreSearch(e.target.value)}
          />
          <input
            type="text"
            placeholder="Address (normalized or official)"
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
            value={addressSearch}
            onChange={(e) => setAddressSearch(e.target.value)}
          />
          <button
            type="button"
            onClick={search}
            disabled={loading}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            Search
          </button>
        </div>
      </section>

      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-200">Pending listing links</h2>
          <ul className="mt-4 space-y-3">
            {pending.map((l) => (
              <li key={l.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="font-medium text-slate-100">{l.propertyUid} · {l.officialAddress}</p>
                <p className="text-sm text-slate-400">Listing: {l.listingId} ({l.listingType})</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => approveLink(l.propertyIdentityId, l.id)}
                    disabled={actioning === l.id}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Approve link
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectLink(l.propertyIdentityId, l.id)}
                    disabled={actioning === l.id}
                    className="rounded-lg border border-red-700 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/30 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-slate-200">Property identities</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="pb-2 pr-4">UID</th>
                <th className="pb-2 pr-4">Cadastre</th>
                <th className="pb-2 pr-4">Address</th>
                <th className="pb-2 pr-4">Score</th>
                <th className="pb-2 pr-4">Links</th>
                <th className="pb-2 pr-4">Risk</th>
                <th className="pb-2 pr-4">Updated</th>
                <th className="pb-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {identities.map((i) => (
                <tr key={i.id} className="border-b border-slate-800">
                  <td className="py-2 pr-4 font-mono text-slate-300">{i.propertyUid}</td>
                  <td className="py-2 pr-4 text-slate-300">{i.cadastreNumber ?? "—"}</td>
                  <td className="max-w-[200px] truncate py-2 pr-4 text-slate-300" title={i.officialAddress}>{i.officialAddress}</td>
                  <td className="py-2 pr-4 text-slate-300">{i.verificationScore ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-300">{i.linkCount}</td>
                  <td className="py-2 pr-4">
                    {i.risk ? (
                      <span className={i.risk.riskLevel === "high" ? "text-red-400" : i.risk.riskLevel === "medium" ? "text-amber-400" : "text-slate-400"}>
                        {i.risk.riskLevel} ({i.risk.riskScore})
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-2 pr-4 text-slate-500">{new Date(i.updatedAt).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">
                    <button
                      type="button"
                      onClick={() => loadDetail(i.id)}
                      className="text-amber-400 hover:text-amber-300"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedId && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold text-slate-200">Detail</h2>
            <button type="button" onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-slate-300">Close</button>
          </div>
          {loading && <p className="mt-2 text-slate-500">Loading…</p>}
          {detail && !loading && (
            <div className="mt-4 space-y-4 text-sm">
              <pre className="overflow-auto rounded bg-slate-800 p-4 text-slate-300">{JSON.stringify(detail, null, 2)}</pre>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
