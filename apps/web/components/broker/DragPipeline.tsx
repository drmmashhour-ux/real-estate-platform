"use client";

import { useCallback, useEffect, useState } from "react";
import { suggestBrokerNextAction } from "@/lib/ai/brain";

type BrokerRef = { id: string; name: string | null; email: string } | undefined;
export type PipelineLead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  listingId?: string | null;
  projectId?: string | null;
  status: string;
  score: number;
  temperature?: "hot" | "warm" | "cold";
  explanation?: string;
  introducedByBroker?: BrokerRef;
  lastFollowUpByBroker?: BrokerRef;
};

const COLUMNS: { id: string; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "visit_scheduled", label: "Visit Scheduled" },
  { id: "negotiation", label: "Negotiation" },
  { id: "closed", label: "Closed" },
  { id: "lost", label: "Lost" },
];

function normalizeStatus(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "_");
}

function LeadCard({
  lead,
  nextAction,
  isDragging,
  onDragStart,
  onRecordFollowUp,
}: {
  lead: PipelineLead;
  nextAction: string;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onRecordFollowUp?: (leadId: string, note: string) => void;
}) {
  const temp = lead.temperature ?? (lead.score >= 70 ? "hot" : lead.score >= 45 ? "warm" : "cold");
  const badge = temp === "hot" ? "🔥" : temp === "warm" ? "⚡" : "❄️";
  const accent = "#10b981";
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpNote, setFollowUpNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function submitFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!onRecordFollowUp || lead.id.startsWith("mem-")) return;
    setSubmitting(true);
    Promise.resolve(onRecordFollowUp(lead.id, followUpNote)).finally(() => {
      setFollowUpNote("");
      setShowFollowUp(false);
      setSubmitting(false);
    });
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e)}
      className={`cursor-grab rounded-xl border p-3 transition-all duration-200 ease-out active:cursor-grabbing hover:scale-[1.02] ${isDragging ? "opacity-50" : ""}`}
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        borderColor: `${accent}40`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm text-white">{lead.name}</p>
        <span className="text-sm" title={temp}>{badge}</span>
      </div>
      {lead.introducedByBroker && (
        <p className="mt-0.5 text-[10px] text-slate-500">
          Introduced by: {lead.introducedByBroker.name ?? lead.introducedByBroker.email}
        </p>
      )}
      {lead.lastFollowUpByBroker && (
        <p className="mt-0.5 text-[10px] text-slate-500">
          Last follow-up: {lead.lastFollowUpByBroker.name ?? lead.lastFollowUpByBroker.email}
        </p>
      )}
      {lead.projectId ? (
        <p className="mt-0.5 truncate text-xs text-slate-400">Project: {lead.projectId}</p>
      ) : lead.listingId ? (
        <p className="mt-0.5 truncate text-xs text-slate-400">Listing: {lead.listingId}</p>
      ) : null}
      <p className="mt-1 text-xs text-slate-300 line-clamp-2">{lead.message || "—"}</p>
      <p className="mt-2 text-xs font-medium" style={{ color: accent }}>
        Score: {lead.score}
      </p>
      <p className="mt-2 rounded bg-white/5 px-2 py-1 text-[11px] text-slate-400">
        Next action: {nextAction}
      </p>
      {onRecordFollowUp && !lead.id.startsWith("mem-") && (
        <div className="mt-2">
          {!showFollowUp ? (
            <button
              type="button"
              onClick={() => setShowFollowUp(true)}
              className="text-[10px] font-medium text-slate-400 hover:text-slate-300"
            >
              Record follow-up
            </button>
          ) : (
            <form onSubmit={submitFollowUp} className="space-y-1">
              <textarea
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                placeholder="Note (optional)"
                rows={2}
                className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-[11px] text-slate-100"
              />
              <div className="flex gap-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded px-2 py-0.5 text-[10px] font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: accent }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setShowFollowUp(false); setFollowUpNote(""); }}
                  className="rounded border border-slate-600 px-2 py-0.5 text-[10px] text-slate-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export function DragPipeline() {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    fetch("/api/leads", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data: PipelineLead[]) => {
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        setLeads(list);
      })
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const getNextAction = useCallback((lead: PipelineLead) => {
    const result = suggestBrokerNextAction({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
    });
    return result.action || "Call within 24h";
  }, []);

  const moveLead = useCallback(
    (leadId: string, newStatus: string) => {
      const status = normalizeStatus(newStatus);
      fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status }),
        credentials: "same-origin",
      })
        .then((res) => {
          if (res.ok) {
            setLeads((prev) =>
              prev.map((l) => (l.id === leadId ? { ...l, status } : l))
            );
          }
        })
        .catch(() => {});
    },
    []
  );

  const recordFollowUp = useCallback((leadId: string, note: string) => {
    return fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, recordFollowUp: true, note }),
      credentials: "same-origin",
    }).then((res) => {
      if (res.ok) fetchLeads();
    });
  }, [fetchLeads]);

  const byColumn = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = leads.filter((l) => normalizeStatus(l.status) === col.id);
      return acc;
    },
    {} as Record<string, PipelineLead[]>
  );

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggingId(leadId);
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(columnId);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDropTarget(null);
    const leadId = e.dataTransfer.getData("text/plain");
    if (!leadId) return;
    const lead = leads.find((l) => l.id === leadId);
    if (lead && normalizeStatus(lead.status) !== columnId) {
      moveLead(leadId, columnId);
    }
    setDraggingId(null);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm text-slate-400">Analyzing with AI...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => (
        <div
          key={col.id}
          onDragOver={(e) => handleDragOver(e, col.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, col.id)}
          className={`min-w-[280px] max-w-[280px] flex-shrink-0 rounded-xl border p-3 transition-all duration-200 ${
            dropTarget === col.id ? "border-emerald-400 bg-emerald-500/10" : "border-white/10 bg-white/5"
          }`}
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            {col.label} ({byColumn[col.id].length})
          </h3>
          <div className="space-y-2">
            {byColumn[col.id].map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                nextAction={getNextAction(lead)}
                isDragging={draggingId === lead.id}
                onDragStart={(e: React.DragEvent) => handleDragStart(e, lead.id)}
                onRecordFollowUp={recordFollowUp}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
