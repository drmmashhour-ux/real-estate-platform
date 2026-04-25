"use client";

import { useEffect, useState } from "react";
import { BrokerLeadCard, type BrokerLead } from "./BrokerLeadCard";

const PIPELINE_COLUMNS = [
  "new",
  "contacted",
  "visit_scheduled",
  "offer_made",
  "negotiation",
  "accepted",
  "closed",
  "lost",
] as const;

const COLUMN_LABELS: Record<(typeof PIPELINE_COLUMNS)[number], string> = {
  new: "New",
  contacted: "Contacted",
  visit_scheduled: "Visit Scheduled",
  offer_made: "Offer Made",
  negotiation: "Negotiation",
  accepted: "Accepted",
  closed: "Closed",
  lost: "Lost",
};

function normalizeStatus(s: string): (typeof PIPELINE_COLUMNS)[number] {
  const lower = s.toLowerCase().replace(/\s+/g, "_");
  const legacy: Record<string, (typeof PIPELINE_COLUMNS)[number]> = {
    qualified: "contacted",
  };
  if (legacy[lower]) return legacy[lower]!;
  if (PIPELINE_COLUMNS.includes(lower as (typeof PIPELINE_COLUMNS)[number])) {
    return lower as (typeof PIPELINE_COLUMNS)[number];
  }
  return "new";
}

export function BrokerPipelineBoard() {
  const [leads, setLeads] = useState<BrokerLead[]>([]);

  useEffect(() => {
    fetch("/api/lecipm/leads", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data: BrokerLead[]) => {
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        setLeads(list);
      })
      .catch(() => setLeads([]));
  }, []);

  const updateStatus = async (leadId: string, status: string) => {
    const res = await fetch("/api/lecipm/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, status }),
      credentials: "same-origin",
    });
    if (!res.ok) return;
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );
  };

  const byColumn = PIPELINE_COLUMNS.reduce(
    (acc, col) => {
      acc[col] = leads.filter((l) => normalizeStatus(l.status) === col);
      return acc;
    },
    {} as Record<(typeof PIPELINE_COLUMNS)[number], BrokerLead[]>
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_COLUMNS.map((col) => (
        <div
          key={col}
          className="min-w-[260px] max-w-[260px] rounded-xl border border-white/10 bg-white/5 p-3"
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            {COLUMN_LABELS[col]} ({byColumn[col].length})
          </h3>
          <div className="space-y-2">
            {byColumn[col].map((lead) => (
              <BrokerLeadCard
                key={lead.id}
                lead={lead}
                onStatusChange={updateStatus}
                nextStatuses={PIPELINE_COLUMNS.filter((c) => c !== col).map((c) => COLUMN_LABELS[c])}
                accent="#10b981"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
