"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AssignmentStatus } from "@/src/modules/sales/constants";

type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  priorityScore: number;
  pipelineStatus: string;
  nextBestAction: string | null;
  nextFollowUpAt: Date | null;
  nextActionAt: Date | null;
  platformConversationId: string | null;
  executionStage: string;
};

export function AgentSalesClient({
  assignments,
}: {
  assignments: { id: string; status: string; lead: LeadRow }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(leadId: string, status: AssignmentStatus) {
    setBusy(leadId);
    try {
      const res = await fetch("/api/agent/sales/assignment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  if (assignments.length === 0) {
    return <p className="mt-4 text-sm text-slate-600">No open assignments — check back after routing runs.</p>;
  }

  return (
    <ul className="mt-4 space-y-4">
      {assignments.map((a) => {
        const l = a.lead;
        return (
          <li key={a.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-white">{l.name}</p>
                <p className="text-sm text-slate-500">{l.email}</p>
                <p className="mt-1 font-mono text-xs text-slate-600">
                  priority {l.priorityScore} · score {l.score} · {l.executionStage}
                </p>
                {l.nextBestAction ? (
                  <p className="mt-2 text-sm text-amber-200/90">Next: {l.nextBestAction}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/dashboard/leads/${l.id}`}
                  className="text-right text-sm text-sky-400 hover:text-sky-300"
                >
                  Open in CRM →
                </Link>
                {l.platformConversationId ? (
                  <Link href="/dashboard/leads" className="text-right text-xs text-slate-500 hover:text-slate-400">
                    Thread linked — use CRM for messages
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === l.id}
                onClick={() => void setStatus(l.id, "contacted")}
                className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-white hover:bg-slate-600 disabled:opacity-50"
              >
                Mark contacted
              </button>
              <button
                type="button"
                disabled={busy === l.id}
                onClick={() => void setStatus(l.id, "closed")}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                Mark closed
              </button>
              <button
                type="button"
                disabled={busy === l.id}
                onClick={() => void setStatus(l.id, "lost")}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Mark lost
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
