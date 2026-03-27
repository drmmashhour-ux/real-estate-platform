"use client";

import { useCallback, useState } from "react";
import { generateFollowUpMessage } from "@/src/modules/daily-execution/domain/outreachCopy";

type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastContactedAt: string | null;
  outreachCoachingStage: string | null;
};

export function FollowUpQueue({
  leads,
  onRefresh,
}: {
  leads: LeadRow[];
  onRefresh: () => Promise<void>;
}) {
  const template = generateFollowUpMessage();
  const [busyId, setBusyId] = useState<string | null>(null);

  const copyFollowUp = useCallback(() => {
    void navigator.clipboard.writeText(template);
  }, [template]);

  const markFollowUpSent = useCallback(
    async (leadId: string) => {
      setBusyId(leadId);
      try {
        const res = await fetch(`/api/daily-execution/leads/${encodeURIComponent(leadId)}/outreach-stage`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: "follow_up_sent" }),
        });
        if (res.ok) await onRefresh();
      } finally {
        setBusyId(null);
      }
    },
    [onRefresh]
  );

  if (leads.length === 0) {
    return (
      <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5 text-slate-100">
        <h2 className="text-lg font-semibold">Follow-up queue</h2>
        <p className="mt-1 text-xs text-slate-500">No leads need a 24h nudge right now (introduced by you, last touch 24h+ ago).</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5 text-slate-100">
      <h2 className="text-lg font-semibold">Follow-up queue</h2>
      <p className="mt-1 text-xs text-slate-500">
        Leads you introduced with no reply logged in coaching — last contact at least 24h ago. Copy, send yourself, then mark
        stage.
      </p>
      <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3">
        <p className="text-xs font-medium text-slate-400">Suggested follow-up</p>
        <pre className="mt-1 whitespace-pre-wrap text-xs text-slate-300">{template}</pre>
        <button
          type="button"
          onClick={() => copyFollowUp()}
          className="mt-2 rounded-md border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5"
        >
          Copy follow-up
        </button>
      </div>
      <ul className="mt-4 space-y-3 text-sm">
        {leads.map((l) => (
          <li key={l.id} className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-200">{l.name}</p>
              <p className="text-xs text-slate-500">
                {l.email} · Last touch: {l.lastContactedAt ? new Date(l.lastContactedAt).toLocaleString() : "—"}
              </p>
            </div>
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => void markFollowUpSent(l.id)}
              className="shrink-0 rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/20 disabled:opacity-40"
            >
              {busyId === l.id ? "…" : "Mark follow-up sent"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
