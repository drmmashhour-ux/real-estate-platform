"use client";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "./autonomy-styles";

export function RiskCompliancePanel(props: {
  blockedActions: number;
  complianceAlerts: number;
  insuranceCoownershipReviewFlags: number | null;
  fraudSignals: Array<{ key: string; count: number }>;
}) {
  return (
    <section className={`${autonomyGlassCard} p-5`}>
      <header className="mb-4 border-b border-[#D4AF37]/15 pb-3">
        <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Section 07</p>
        <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Risk & compliance monitor</h2>
        <p className={`mt-1 text-sm ${autonomyMuted}`}>
          Highlights policy friction — blocked autopilot executions, governance alerts, and CRM integrity flags.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-red-500/25 bg-red-950/25 p-4">
          <p className="text-xs uppercase text-red-200/90">Blocked actions (feed)</p>
          <p className="mt-2 font-serif text-3xl text-red-100">{props.blockedActions}</p>
        </div>
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-4">
          <p className="text-xs uppercase text-amber-100/90">Compliance alerts</p>
          <p className="mt-2 font-serif text-3xl text-amber-50">{props.complianceAlerts}</p>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/20 bg-black/45 p-4">
          <p className={`text-xs uppercase ${autonomyMuted}`}>Deal integrity review flags</p>
          <p className="mt-2 font-serif text-3xl text-[#f4efe4]">
            {props.insuranceCoownershipReviewFlags != null ? props.insuranceCoownershipReviewFlags : "—"}
          </p>
          <p className={`mt-2 text-[11px] ${autonomyMuted}`}>Bypass + commission eligibility heuristic — not legal advice.</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-[#D4AF37]/10 bg-black/40 p-4">
        <p className={`text-xs uppercase ${autonomyMuted}`}>Repeated block signatures</p>
        <ul className="mt-2 space-y-1 text-sm text-[#e8dfd0]">
          {props.fraudSignals.length === 0 ?
            <li className={autonomyMuted}>No clustered blocks this window.</li>
          : props.fraudSignals.map((f) => (
              <li key={f.key}>
                {f.key}{" "}
                <span className="text-[#D4AF37]">
                  ×{f.count}
                </span>
              </li>
            ))
          }
        </ul>
      </div>
    </section>
  );
}
