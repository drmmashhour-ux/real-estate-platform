"use client";

import { useMemo, useState } from "react";
import type { ConversationType } from "@prisma/client";
import type { InboxConversationRow } from "@/modules/messaging/services/get-user-conversations";

type Props = {
  rows: InboxConversationRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const TYPE_LABEL: Record<string, string> = {
  DIRECT: "Direct",
  LISTING: "Listing",
  OFFER: "Offer",
  CONTRACT: "Contract",
  APPOINTMENT: "Appointment",
  CLIENT_THREAD: "Client",
  SUPPORT: "Support",
};

export function ConversationList({ rows, selectedId, onSelect }: Props) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<ConversationType | "ALL">("ALL");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (!showArchived && r.isArchived) return false;
      if (type !== "ALL" && r.type !== type) return false;
      if (!qq) return true;
      const hay = [
        r.subject,
        r.lastMessagePreview,
        r.contextSummary,
        ...r.otherParticipantNames,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [rows, q, type, showArchived]);

  return (
    <div className="flex min-h-0 flex-col border-r border-white/10 bg-black/40">
      <div className="space-y-2 border-b border-white/10 p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-slate-600"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ConversationType | "ALL")}
            className="rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-xs text-slate-200"
          >
            <option value="ALL">All types</option>
            <option value="LISTING">Listing</option>
            <option value="OFFER">Offer</option>
            <option value="CONTRACT">Contract</option>
            <option value="APPOINTMENT">Appointment</option>
            <option value="CLIENT_THREAD">Client</option>
            <option value="DIRECT">Direct</option>
          </select>
          <label className="flex items-center gap-1 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Archived
          </label>
        </div>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="p-4 text-sm text-slate-500">No conversations</li>
        ) : (
          filtered.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelect(r.id)}
                className={`w-full border-b border-white/5 px-3 py-3 text-left transition hover:bg-white/5 ${
                  selectedId === r.id ? "bg-emerald-950/40" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-100">
                      {r.subject || r.otherParticipantNames.join(", ") || "Conversation"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {r.contextKind ? (
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                          {TYPE_LABEL[r.type] ?? r.type}
                        </span>
                      ) : (
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                          {TYPE_LABEL[r.type] ?? r.type}
                        </span>
                      )}
                      {r.contextSummary ? (
                        <span className="truncate text-[11px] text-slate-500">{r.contextSummary}</span>
                      ) : null}
                    </div>
                    {r.lastMessagePreview ? (
                      <p className="mt-1 truncate text-xs text-slate-500">{r.lastMessagePreview}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    {r.lastMessageAt ? (
                      <p className="text-[10px] text-slate-500">
                        {new Date(r.lastMessageAt).toLocaleDateString()}
                      </p>
                    ) : null}
                    {r.unreadCount > 0 ? (
                      <span className="mt-1 inline-flex min-w-[1.25rem] justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                        {r.unreadCount > 99 ? "99+" : r.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
