"use client";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "./autonomy-styles";

export function RevenueGrowthPanel(props: {
  bookingsTrend: number | null;
  conversionTrend: number | null;
  roiNote?: { linkedRows?: number; note?: string } | null;
  capitalNote?: { linkedRows?: number; note?: string } | null;
}) {
  return (
    <section className={`${autonomyGlassCard} p-5`}>
      <header className="mb-4 border-b border-[#D4AF37]/15 pb-3">
        <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Section 04</p>
        <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Revenue & growth intelligence</h2>
        <p className={`mt-1 text-sm ${autonomyMuted}`}>
          Directional signals — banded ROI, not promises. Deep revenue intelligence continues to flow from executive
          snapshots.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#D4AF37]/10 bg-black/40 p-4">
          <p className={`text-xs uppercase ${autonomyMuted}`}>Bookings pulse (today)</p>
          <p className="mt-2 font-serif text-3xl text-[#f4efe4]">
            {props.bookingsTrend != null ? props.bookingsTrend : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/10 bg-black/40 p-4">
          <p className={`text-xs uppercase ${autonomyMuted}`}>Conversion proxy</p>
          <p className="mt-2 font-serif text-3xl text-[#f4efe4]">
            {props.conversionTrend == null ?
              "—"
            : `${(props.conversionTrend <= 1 ? props.conversionTrend * 100 : props.conversionTrend).toFixed(1)}%`}
          </p>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/10 bg-black/40 p-4 md:col-span-2">
          <p className={`text-xs uppercase ${autonomyMuted}`}>ROI signals (banded)</p>
          <p className={`mt-2 text-sm ${autonomyMuted}`}>{props.roiNote?.note ?? "Awaiting outcome linkage."}</p>
          {props.roiNote?.linkedRows != null ?
            <p className="mt-2 text-xs text-[#9ae6b4]">Linked executions (7d): {props.roiNote.linkedRows}</p>
          : null}
        </div>
        <div className="rounded-xl border border-[#D4AF37]/10 bg-black/40 p-4 md:col-span-2">
          <p className={`text-xs uppercase ${autonomyMuted}`}>Capital allocation impact</p>
          <p className={`mt-2 text-sm ${autonomyMuted}`}>
            {props.capitalNote?.note ??
              "Allocator recommendations remain approval-gated — impact surfaces through outcome deltas once trades settle."}
          </p>
        </div>
      </div>
    </section>
  );
}
