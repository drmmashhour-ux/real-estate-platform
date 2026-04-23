"use client";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "./autonomy-styles";

export function MarketingExpansionPanel(props: {
  campaignsRunning: number | null;
  seoPagesGenerated: number | null;
  calendarNote?: string | null;
}) {
  return (
    <section className={`${autonomyGlassCard} p-5`}>
      <header className="mb-4 border-b border-[#D4AF37]/15 pb-3">
        <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Section 06</p>
        <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Marketing & expansion engine</h2>
        <p className={`mt-1 text-sm ${autonomyMuted}`}>{props.calendarNote}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#D4AF37]/10 bg-black/40 p-4">
          <p className={`text-xs uppercase ${autonomyMuted}`}>Campaigns touched (MTD)</p>
          <p className="mt-2 font-serif text-3xl text-[#f4efe4]">
            {props.campaignsRunning != null ? props.campaignsRunning : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/10 bg-black/40 p-4">
          <p className={`text-xs uppercase ${autonomyMuted}`}>SEO drafts inventory</p>
          <p className="mt-2 font-serif text-3xl text-[#f4efe4]">
            {props.seoPagesGenerated != null ? props.seoPagesGenerated : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/10 bg-black/35 p-4 md:col-span-2">
          <p className={`text-xs uppercase ${autonomyMuted}`}>City launch radar</p>
          <p className={`mt-2 text-sm ${autonomyMuted}`}>
            Expansion telemetry plugs into growth ops — populate city-level tables to activate this lane.
          </p>
        </div>
      </div>
    </section>
  );
}
