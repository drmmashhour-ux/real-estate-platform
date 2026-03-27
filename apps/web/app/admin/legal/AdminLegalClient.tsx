"use client";

import { useState } from "react";
import Link from "next/link";
import { LEGAL_DOCUMENT_TYPES, LEGAL_PATHS } from "@/lib/legal/constants";

type DocRecord = {
  id: string;
  type: string;
  version: string;
  content: string;
  isActive: boolean;
  createdAt: string;
};

type AcceptanceStat = { documentType: string; version: string; count: number };

const TYPE_LABELS: Record<string, string> = {
  [LEGAL_DOCUMENT_TYPES.TERMS]: "Terms of Service",
  [LEGAL_DOCUMENT_TYPES.PRIVACY]: "Privacy Policy",
  [LEGAL_DOCUMENT_TYPES.COOKIES]: "Cookie Policy",
  [LEGAL_DOCUMENT_TYPES.BNHUB_HOST_AGREEMENT]: "BNHub Host Agreement",
  [LEGAL_DOCUMENT_TYPES.BNHUB_LONG_TERM_RENTAL_AGREEMENT]: "BNHub Long-Term Rental Agreement",
  [LEGAL_DOCUMENT_TYPES.BNHUB_BROKER_COLLABORATION_AGREEMENT]: "BNHub Broker Collaboration & Commission",
  [LEGAL_DOCUMENT_TYPES.BNHUB_GUEST_POLICY]: "BNHub Guest Protection",
  [LEGAL_DOCUMENT_TYPES.BROKER_AGREEMENT]: "Broker Agreement",
  [LEGAL_DOCUMENT_TYPES.PLATFORM_USAGE]: "Platform Usage Policy",
  [LEGAL_DOCUMENT_TYPES.PLATFORM_ACKNOWLEDGMENT]: "Platform Acknowledgment & User Responsibility",
};

export function AdminLegalClient({
  activeDocs,
  docsByType,
  stats,
}: {
  activeDocs: DocRecord[];
  docsByType: Record<string, DocRecord[]>;
  stats: AcceptanceStat[];
}) {
  const [type, setType] = useState<string>(LEGAL_DOCUMENT_TYPES.TERMS);
  const [version, setVersion] = useState("");
  const [content, setContent] = useState("");
  const [setActive, setSetActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!version.trim()) {
      setMessage({ ok: false, text: "Version is required." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/legal/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, version: version.trim(), content, setActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error || "Failed to create document." });
        return;
      }
      setMessage({ ok: true, text: `Created ${type} v${version}. Refreshing...` });
      setVersion("");
      setContent("");
      window.location.reload();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetActive(docId: string) {
    setActivatingId(docId);
    try {
      const res = await fetch("/api/legal/documents/set-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({ ok: false, text: data.error || "Failed to activate." });
        return;
      }
      window.location.reload();
    } finally {
      setActivatingId(null);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      {/* Current active documents */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Active documents</h2>
        <p className="mt-1 text-sm text-slate-500">Current live version per type. Users see these on legal pages.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-400">
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Version</th>
                <th className="pb-2 pr-4">Updated</th>
                <th className="pb-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(LEGAL_DOCUMENT_TYPES).map((t) => {
                const doc = activeDocs.find((d) => d.type === t);
                const path = LEGAL_PATHS[t] || "/legal/terms";
                return (
                  <tr key={t} className="border-b border-slate-800">
                    <td className="py-2 pr-4 text-slate-300">{TYPE_LABELS[t] ?? t}</td>
                    <td className="py-2 pr-4 text-slate-400">{doc ? doc.version : "—"}</td>
                    <td className="py-2 pr-4 text-slate-500">
                      {doc ? new Date(doc.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2">
                      {doc ? (
                        <Link href={path} className="text-emerald-400 hover:text-emerald-300" target="_blank" rel="noopener noreferrer">
                          View
                        </Link>
                      ) : (
                        <span className="text-slate-600">No version</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create / edit new version */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Create new version</h2>
        <p className="mt-1 text-sm text-slate-500">Add a new version of a document. Optionally set it as active (users will see it).</p>
        {message && (
          <p className={`mt-3 text-sm ${message.ok ? "text-emerald-400" : "text-amber-400"}`}>
            {message.text}
          </p>
        )}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-400">Document type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full max-w-xs rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Version (e.g. 1.0)</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0"
              className="mt-1 w-full max-w-xs rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Content (HTML)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-sm text-slate-200"
              placeholder="<h1>Title</h1><p>...</p>"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={setActive}
              onChange={(e) => setSetActive(e.target.checked)}
              className="rounded border-slate-600"
            />
            Set as active version (users will see this)
          </label>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Create version"}
          </button>
        </div>
      </section>

      {/* Versions per type + Activate */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Versions by type</h2>
        <p className="mt-1 text-sm text-slate-500">Activate a previous version to make it live.</p>
        <div className="mt-4 space-y-6">
          {Object.entries(LEGAL_DOCUMENT_TYPES).map(([, value]) => {
            const docs = docsByType[value] || [];
            return (
              <div key={value}>
                <h3 className="text-sm font-medium text-slate-400">{TYPE_LABELS[value] ?? value}</h3>
                <ul className="mt-2 space-y-1">
                  {docs.length === 0 && <li className="text-sm text-slate-500">No versions yet.</li>}
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 text-sm">
                      <span className="text-slate-300">v{d.version}</span>
                      <span className="text-slate-500">{new Date(d.createdAt).toLocaleString()}</span>
                      {d.isActive && <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-300">Active</span>}
                      {!d.isActive && (
                        <button
                          onClick={() => handleSetActive(d.id)}
                          disabled={activatingId !== null}
                          className="rounded border border-slate-600 px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-50"
                        >
                          {activatingId === d.id ? "Activating…" : "Activate"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Acceptance stats */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Acceptance stats</h2>
        <p className="mt-1 text-sm text-slate-500">Number of users who accepted each document version.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-400">
                <th className="pb-2 pr-4">Document</th>
                <th className="pb-2 pr-4">Version</th>
                <th className="pb-2">Acceptances</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-slate-500">No acceptances recorded yet.</td></tr>
              )}
              {stats.map((s, i) => (
                <tr key={i} className="border-b border-slate-800">
                  <td className="py-2 pr-4 text-slate-300">{TYPE_LABELS[s.documentType] ?? s.documentType}</td>
                  <td className="py-2 pr-4 text-slate-400">v{s.version}</td>
                  <td className="py-2 text-slate-400">{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
