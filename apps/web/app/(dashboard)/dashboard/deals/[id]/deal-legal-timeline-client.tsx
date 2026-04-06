"use client";

import { useState } from "react";

type Timeline = {
  currentStage: string;
  stages: Array<{ key: string; label: string; status: string }>;
  events: Array<{
    id: string;
    eventType: string;
    createdAt: string | Date;
    note: string | null;
    stage: string | null;
    documents?: Array<{ id: string; type: string; status: string; fileUrl: string; source: "deal_document" | "offer_document" }>;
  }>;
  availableActions: Array<{ key: string; label: string; stage: string }>;
  documents?: Array<{
    id: string;
    type: string;
    status: string;
    fileUrl: string;
    createdAt: string | Date;
    source: "deal_document" | "offer_document";
  }>;
};

function stageClasses(status: string) {
  if (status === "completed") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "current") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-white/10 bg-black/20 text-slate-400";
}

export function DealLegalTimelineClient({
  dealId,
  timeline,
  canEdit,
}: {
  dealId: string;
  timeline: Timeline;
  canEdit: boolean;
}) {
  const [selectedAction, setSelectedAction] = useState("");
  const [note, setNote] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggleDocument(id: string) {
    setSelectedDocumentIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  async function applyAction() {
    if (!selectedAction) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/deals/${dealId}/legal-timeline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: selectedAction, note, documentIds: selectedDocumentIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to update legal timeline");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-medium text-slate-200">Legal transaction timeline</h2>
      <p className="mt-1 text-sm text-slate-400">
        Current legal stage: <span className="text-white">{timeline.currentStage.replace(/_/g, " ")}</span>
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {timeline.stages.map((stage) => (
          <div key={stage.key} className={`rounded-xl border p-3 ${stageClasses(stage.status)}`}>
            <p className="text-xs uppercase tracking-wide">{stage.status}</p>
            <p className="mt-2 text-sm font-medium">{stage.label}</p>
          </div>
        ))}
      </div>

      {canEdit ? (
        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-amber-200">Record legal stage action</p>
          <div className="mt-3 grid gap-3">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="">Select action</option>
              {timeline.availableActions.map((action) => (
                <option key={action.key} value={action.key}>
                  {action.label}
                </option>
              ))}
            </select>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Legal note, clause summary, or why the stage changed"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            {timeline.documents && timeline.documents.length > 0 ? (
              <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attach legal documents to this stage</p>
                <div className="mt-2 space-y-2">
                  {timeline.documents.map((doc) => (
                    <label key={doc.id} className="flex items-start gap-2 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={selectedDocumentIds.includes(doc.id)}
                        onChange={() => toggleDocument(doc.id)}
                        className="mt-1"
                      />
                      <span>
                        {doc.type} · {doc.status} · {doc.source === "offer_document" ? "offer draft" : "uploaded file"}
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-premium-gold hover:underline">
                          Open
                        </a>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <button
              type="button"
              disabled={busy || !selectedAction}
              onClick={() => void applyAction()}
              className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy ? "Saving..." : "Save legal action"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <p className="text-sm font-semibold text-slate-200">Audit events</p>
        {timeline.events.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No legal-stage audit events yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {timeline.events
              .slice()
              .reverse()
              .map((event) => (
                <li key={event.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-medium text-white">{event.stage?.replace(/_/g, " ") ?? event.eventType}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
                  {event.note ? <p className="mt-2 text-sm text-slate-300">{event.note}</p> : null}
                  {event.documents && event.documents.length > 0 ? (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attached documents</p>
                      {event.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-premium-gold hover:underline"
                        >
                          {doc.type} · {doc.status} · {doc.source === "offer_document" ? "offer draft" : "uploaded file"}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}
