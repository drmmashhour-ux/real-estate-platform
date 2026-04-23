"use client";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "./autonomy-styles";

export type ApprovalQueueRow = {
  id: string;
  executionId: string | null;
  domain: string;
  actionType: string;
  explanation: string;
  riskLevel: string;
  status: string;
};

export function ApprovalQueuePanel(props: {
  rows: ApprovalQueueRow[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onInspect: (id: string) => void;
}) {
  const pending = props.rows.filter((r) => r.status === "PENDING");

  return (
    <section className={`${autonomyGlassCard} p-5`}>
      <header className="mb-4 border-b border-[#D4AF37]/15 pb-3">
        <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Section 08</p>
        <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Approval queue</h2>
        <p className={`mt-1 text-sm ${autonomyMuted}`}>Human gates for pricing, investments, marketplace apply, and high-risk lanes.</p>
      </header>
      <ul className="space-y-3">
        {pending.length === 0 ?
          <li className={`rounded-xl border border-[#D4AF37]/10 px-4 py-6 text-center text-sm ${autonomyMuted}`}>
            Queue clear — autopilot proposals will surface here when policy demands approval.
          </li>
        : pending.map((r) => (
            <li key={r.id} className="rounded-xl border border-[#D4AF37]/15 bg-black/45 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#D4AF37]">{r.domain}</p>
                  <p className="font-medium text-[#f4efe4]">{r.actionType}</p>
                </div>
                <span className="rounded-full border border-[#D4AF37]/30 px-2 py-0.5 text-[11px] uppercase text-[#f4efe4]">
                  {r.riskLevel}
                </span>
              </div>
              <p className={`mt-2 text-sm ${autonomyMuted}`}>{r.explanation}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-emerald-600/60 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-900/50"
                  onClick={() => void props.onApprove(r.id)}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-700/60 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-900/50"
                  onClick={() => void props.onReject(r.id)}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[#D4AF37]/35 px-3 py-1.5 text-xs text-[#E8D889] hover:bg-[#D4AF37]/10"
                  onClick={() => props.onInspect(r.id)}
                >
                  Inspect explanation
                </button>
              </div>
            </li>
          ))
        }
      </ul>
    </section>
  );
}
