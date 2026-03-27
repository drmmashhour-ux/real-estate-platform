"use client";

import Link from "next/link";

export type BrokerLead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  listingId?: string;
  /** Immutable public BNHub listing id (LEC-#####) */
  listingCode?: string | null;
  status: string;
  score: number;
  temperature?: "hot" | "warm" | "cold";
  explanation?: string;
  createdAt?: string;
};

type BrokerLeadCardProps = {
  lead: BrokerLead;
  onStatusChange?: (leadId: string, newStatus: string) => void;
  nextStatuses?: string[];
  accent?: string;
};

export function BrokerLeadCard({
  lead,
  onStatusChange,
  nextStatuses = ["Contacted", "Qualified", "Visit Scheduled", "Negotiation", "Closed", "Lost"],
  accent = "#10b981",
}: BrokerLeadCardProps) {
  const temp = lead.temperature ?? (lead.score >= 70 ? "hot" : lead.score >= 45 ? "warm" : "cold");
  const tempColor = temp === "hot" ? "#f97316" : temp === "warm" ? "#eab308" : "#38bdf8";

  return (
    <div
      className="rounded-lg border p-3 transition-shadow hover:shadow-md"
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        borderColor: `${accent}30`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm text-white">{lead.name}</p>
        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${tempColor}30`, color: tempColor }}>
          {temp}
        </span>
      </div>
      <p className="mt-0.5 truncate text-xs text-slate-400">{lead.email}</p>
      {(lead.listingCode || lead.listingId) && (
        <p className="mt-1 text-[11px] text-slate-500">
          <span className="text-slate-600">Listing ID</span>{" "}
          {lead.listingCode ? (
            <Link
              href={`/bnhub/${encodeURIComponent(lead.listingCode)}`}
              className="font-mono text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-white"
            >
              {lead.listingCode}
            </Link>
          ) : (
            <span className="font-mono text-slate-400">{lead.listingId}</span>
          )}
        </p>
      )}
      <p className="mt-1 text-xs text-slate-300 line-clamp-2">{lead.message || "—"}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: accent }}>Score: {lead.score}</span>
      </div>
      {onStatusChange && nextStatuses.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {nextStatuses.slice(0, 3).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStatusChange(lead.id, s.toLowerCase().replace(/\s+/g, "_"))}
              className="rounded px-2 py-1 text-[10px] font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: `${accent}30`, color: accent }}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
