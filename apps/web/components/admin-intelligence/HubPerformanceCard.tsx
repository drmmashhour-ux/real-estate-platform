"use client";

import Link from "next/link";

import type { HubPerformanceRow } from "@/modules/admin-intelligence/admin-intelligence.types";

const gold = "#D4AF37";

export function HubPerformanceCard({
  row,
  adminBase,
}: {
  row: HubPerformanceRow;
  adminBase: string;
}) {
  const delta = row.deltaPctVsPriorDay;
  const deltaLabel =
    delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}%`;

  return (
    <Link
      href={`${adminBase}/hubs`}
      className="group block rounded-2xl border px-4 py-4 transition hover:border-[#D4AF37]/45"
      style={{
        borderColor: "rgba(212, 175, 55, 0.15)",
        background: "linear-gradient(135deg, rgba(16,16,16,0.95), rgba(8,8,8,0.98))",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Hub</p>
          <p className="font-serif text-lg text-white group-hover:text-[#D4AF37]">{row.hubLabel}</p>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{
            color: delta != null && delta >= 0 ? "#86efac" : delta != null && delta < 0 ? "#fca5a5" : gold,
            background: "rgba(255,255,255,0.05)",
          }}
        >
          {deltaLabel}
        </span>
      </div>
      <p className="mt-3 font-mono text-sm text-zinc-300">
        {(row.revenueCents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}{" "}
        <span className="text-zinc-500">CAD share</span>
      </p>
    </Link>
  );
}
