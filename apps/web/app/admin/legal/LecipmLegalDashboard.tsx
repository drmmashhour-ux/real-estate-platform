"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CORPORATE_DOC_TYPE_LABELS,
  CORPORATE_LEGAL_DOC_TYPES,
  CORPORATE_LEGAL_STATUSES,
} from "@/lib/legal-management/constants";
import type { ComplianceRow } from "@/lib/legal-management/compliance";

type CorpDoc = {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
};

type StructureRow = {
  id: string;
  entityType: string;
  jurisdiction: string;
  createdAt: string;
};

export function LecipmLegalDashboard({
  documents,
  structures,
  complianceRows,
  allSigned,
}: {
  documents: CorpDoc[];
  structures: StructureRow[];
  complianceRows: ComplianceRow[];
  allSigned: boolean;
}) {
  const router = useRouter();
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<string>(CORPORATE_LEGAL_DOC_TYPES[0]);
  const [docStatus, setDocStatus] = useState<string>("draft");
  const [entityType, setEntityType] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function addDocument() {
    if (!docName.trim()) {
      setMsg({ ok: false, text: "Name is required." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/legal-management/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: docName.trim(), type: docType, status: docStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "Failed to add document." });
        return;
      }
      setDocName("");
      setMsg({ ok: true, text: "Document recorded." });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function patchDocStatus(id: string, status: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/legal-management/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "Update failed." });
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function addStructure() {
    if (!entityType.trim() || !jurisdiction.trim()) {
      setMsg({ ok: false, text: "Entity type and jurisdiction are required." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/legal-management/company-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: entityType.trim(),
          jurisdiction: jurisdiction.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "Failed to add entity." });
        return;
      }
      setEntityType("");
      setJurisdiction("");
      setMsg({ ok: true, text: "Company structure entry added." });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div
        className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-center text-sm font-semibold tracking-wide text-emerald-200"
        role="status"
      >
        LECIPM LEGAL SYSTEM ACTIVE
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Compliance checklist</h2>
        <p className="mt-1 text-sm text-slate-500">
          Required corporate document types must be tracked; latest row per type should be signed for full compliance.
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span
            className={
              allSigned ? "font-medium text-emerald-400" : "font-medium text-amber-400"
            }
          >
            {allSigned ? "All required documents signed" : "Action required"}
          </span>
        </div>
        <ul className="mt-4 space-y-2">
          {complianceRows.map((row) => (
            <li
              key={row.type}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
            >
              <span className="text-slate-200">{CORPORATE_DOC_TYPE_LABELS[row.type]}</span>
              <span className="text-slate-400">
                {!row.tracked && "Not tracked"}
                {row.tracked && !row.signed && `Latest: ${row.latestStatus ?? "—"} (${row.latestName ?? "unnamed"})`}
                {row.signed && `Signed — ${row.latestName ?? "record"}`}
              </span>
              {row.signed ? (
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">OK</span>
              ) : row.tracked ? (
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">Draft / pending</span>
              ) : (
                <span className="rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-200">Missing</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Corporate legal documents</h2>
        <p className="mt-1 text-sm text-slate-500">Track agreements and policies (draft vs signed).</p>
        {msg && (
          <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-400" : "text-amber-400"}`}>{msg.text}</p>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-400">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Created</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-slate-500">
                    No corporate documents yet.
                  </td>
                </tr>
              )}
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-slate-800">
                  <td className="py-2 pr-4 text-slate-300">{d.name}</td>
                  <td className="py-2 pr-4 text-slate-400">
                    {CORPORATE_DOC_TYPE_LABELS[d.type as keyof typeof CORPORATE_DOC_TYPE_LABELS] ?? d.type}
                  </td>
                  <td className="py-2 pr-4 text-slate-400">{d.status}</td>
                  <td className="py-2 pr-4 text-slate-500">
                    {new Date(d.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2">
                    {d.status !== "signed" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => patchDocStatus(d.id, "signed")}
                        className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                      >
                        Mark signed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid gap-3 border-t border-slate-800 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400">Name</label>
            <input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
              placeholder="e.g. 2026 SHA — Lecipm Inc."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
            >
              {CORPORATE_LEGAL_DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CORPORATE_DOC_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Status</label>
            <select
              value={docStatus}
              onChange={(e) => setDocStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
            >
              {CORPORATE_LEGAL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={addDocument}
          disabled={busy}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Add document"}
        </button>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Company structure</h2>
        <p className="mt-1 text-sm text-slate-500">Entities and jurisdictions on file.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-400">
                <th className="pb-2 pr-4">Entity type</th>
                <th className="pb-2 pr-4">Jurisdiction</th>
                <th className="pb-2">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {structures.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-slate-500">
                    No structure entries yet.
                  </td>
                </tr>
              )}
              {structures.map((s) => (
                <tr key={s.id} className="border-b border-slate-800">
                  <td className="py-2 pr-4 text-slate-300">{s.entityType}</td>
                  <td className="py-2 pr-4 text-slate-400">{s.jurisdiction}</td>
                  <td className="py-2 text-slate-500">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-6">
          <div className="min-w-[160px] flex-1">
            <label className="block text-xs font-medium text-slate-400">Entity type</label>
            <input
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
              placeholder="e.g. C-Corp, HoldCo"
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="block text-xs font-medium text-slate-400">Jurisdiction</label>
            <input
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
              placeholder="e.g. Delaware, UAE"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={addStructure}
          disabled={busy}
          className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Add structure entry"}
        </button>
      </section>
    </div>
  );
}
