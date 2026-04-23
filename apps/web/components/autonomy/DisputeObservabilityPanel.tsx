"use client";

import Link from "next/link";

import type { DisputeObservabilityMetrics } from "@/modules/disputes/dispute.types";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "./autonomy-styles";

function pct(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(2)}%`;
}

export function DisputeObservabilityPanel(props: {
  metrics: DisputeObservabilityMetrics | null | undefined;
}) {
  const m = props.metrics;
  return (
    <section className={`${autonomyGlassCard} p-5`}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[#D4AF37]/15 pb-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Section 08</p>
          <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Dispute observability</h2>
          <p className={`mt-1 text-sm ${autonomyMuted}`}>
            LECIPM dispute rate, resolution cadence, and category drivers — wired to bookings and case warehouse.
          </p>
        </div>
        <Link
          href="/dashboard/admin/disputes"
          className="rounded-lg border border-[#D4AF37]/35 bg-black/50 px-3 py-1.5 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          Open disputes hub →
        </Link>
      </header>

      {!m ?
        <p className={`text-sm ${autonomyMuted}`}>Dispute metrics unavailable (check DB / permissions).</p>
      : <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-[#D4AF37]/20 bg-black/45 p-4">
              <p className={`text-xs uppercase ${autonomyMuted}`}>Open pipeline</p>
              <p className="mt-2 font-serif text-3xl text-[#f4efe4]">{m.totalOpen}</p>
              <p className={`mt-1 text-[11px] ${autonomyMuted}`}>OPEN + IN_REVIEW + ESCALATED</p>
            </div>
            <div className="rounded-xl border border-[#D4AF37]/20 bg-black/45 p-4">
              <p className={`text-xs uppercase ${autonomyMuted}`}>All-time cases</p>
              <p className="mt-2 font-serif text-3xl text-[#f4efe4]">{m.total}</p>
            </div>
            <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-4">
              <p className="text-xs uppercase text-amber-100/90">Avg resolution</p>
              <p className="mt-2 font-serif text-3xl text-amber-50">
                {m.avgResolutionDays != null ? `${m.avgResolutionDays.toFixed(1)}d` : "—"}
              </p>
              <p className={`mt-1 text-[11px] ${autonomyMuted}`}>
                n={m.sampleSize} resolved sample
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
              <p className="text-xs uppercase text-emerald-100/85">Dispute rate / booking (30d)</p>
              <p className="mt-2 font-serif text-3xl text-emerald-50">{pct(m.disputeRatePerBooking30d)}</p>
              <p className={`mt-1 text-[11px] ${autonomyMuted}`}>
                {m.disputesLast30dBooking} disputes · {m.bookingsLast30d} bookings
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[#D4AF37]/10 bg-black/40 p-4">
              <p className={`text-xs uppercase ${autonomyMuted}`}>By status</p>
              <ul className="mt-2 space-y-1.5 text-sm text-[#e8dfd0]">
                {m.byStatus.length === 0 ?
                  <li className={autonomyMuted}>No cases.</li>
                : m.byStatus.map((s) => (
                    <li key={s.status} className="flex justify-between gap-2">
                      <span>{s.status}</span>
                      <span className={autonomyGoldText}>{s._count._all}</span>
                    </li>
                  ))
                }
              </ul>
            </div>
            <div className="rounded-xl border border-[#D4AF37]/10 bg-black/40 p-4">
              <p className={`text-xs uppercase ${autonomyMuted}`}>Top causes (category)</p>
              <ul className="mt-2 space-y-1.5 text-sm text-[#e8dfd0]">
                {m.topCauses.length === 0 ?
                  <li className={autonomyMuted}>No category rollup yet.</li>
                : m.topCauses.map((c) => (
                    <li key={c.category} className="flex justify-between gap-2">
                      <span className="truncate" title={c.category}>
                        {c.category || "—"}
                      </span>
                      <span className={autonomyGoldText}>×{c.count}</span>
                    </li>
                  ))
                }
              </ul>
            </div>
          </div>

          <p className={`rounded-lg border border-[#D4AF37]/10 bg-black/30 px-3 py-2 text-[11px] leading-relaxed ${autonomyMuted}`}>
            <span className="text-[#e8dfd0]/90">Conversion impact:</span> {m.conversionImpactNote}
          </p>
        </div>
      }
    </section>
  );
}
