"use client";

import Link from "next/link";

import type { AdminAnomalyVm } from "@/modules/admin-intelligence/admin-intelligence.types";

const gold = "#D4AF37";

function severityStyle(s: AdminAnomalyVm["severity"]) {
  switch (s) {
    case "HIGH":
      return { border: "rgba(248, 113, 113, 0.45)", accent: "#fecaca" };
    case "MEDIUM":
      return { border: "rgba(250, 204, 21, 0.35)", accent: "#fde047" };
    default:
      return { border: "rgba(212, 175, 55, 0.22)", accent: gold };
  }
}

export function AlertCard({ anomaly, adminBase }: { anomaly: AdminAnomalyVm; adminBase: string }) {
  const st = severityStyle(anomaly.severity);
  return (
    <Link
      href={`${adminBase}/anomalies`}
      className="block rounded-2xl border px-4 py-4 transition hover:brightness-110"
      style={{ borderColor: st.border, background: "rgba(8,8,8,0.92)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: st.accent }}>
          {anomaly.severity}
        </span>
        <span className="text-[10px] text-zinc-600">Review →</span>
      </div>
      <p className="mt-2 font-serif text-base text-white">{anomaly.title}</p>
      <p className="mt-1 text-sm text-zinc-400">{anomaly.explanation}</p>
      <p className="mt-3 text-xs text-zinc-500">{anomaly.recommendedAction}</p>
    </Link>
  );
}
