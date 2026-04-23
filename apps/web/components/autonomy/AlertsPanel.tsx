"use client";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "./autonomy-styles";

export type AlertRow = {
  kind: string;
  severity: string;
  title: string;
  detail: string;
};

export function AlertsPanel(props: { rows: AlertRow[] }) {
  return (
    <section className={`${autonomyGlassCard} p-5`}>
      <header className="mb-4 border-b border-[#D4AF37]/15 pb-3">
        <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Section 09</p>
        <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Alerts & anomalies</h2>
        <p className={`mt-1 text-sm ${autonomyMuted}`}>Blends autopilot evaluator alerts with clustered block signatures.</p>
      </header>
      <ul className="space-y-2">
        {props.rows.length === 0 ?
          <li className={`rounded-lg border border-[#D4AF37]/10 px-3 py-4 text-sm ${autonomyMuted}`}>No anomalies flagged.</li>
        : props.rows.map((r, idx) => (
            <li
              key={`${r.kind}-${idx}`}
              className="rounded-xl border border-[#D4AF37]/15 bg-black/45 px-4 py-3 text-sm text-[#f0ebe3]"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wide text-[#c9b667]">{r.kind}</span>
                <span className="text-[11px] uppercase text-[#f4efe4]">{r.severity}</span>
              </div>
              <p className="mt-1 font-medium">{r.title}</p>
              <p className={`mt-1 text-xs ${autonomyMuted}`}>{r.detail}</p>
            </li>
          ))
        }
      </ul>
    </section>
  );
}
