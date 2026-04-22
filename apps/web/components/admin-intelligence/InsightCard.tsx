"use client";

import type { AiInsightVm } from "@/modules/admin-intelligence/admin-intelligence.types";

const gold = "#D4AF37";

export function InsightCard({ insight }: { insight: AiInsightVm }) {
  const border =
    insight.tone === "positive"
      ? "rgba(134, 239, 172, 0.25)"
      : insight.tone === "warning"
        ? "rgba(250, 204, 21, 0.28)"
        : "rgba(212, 175, 55, 0.2)";

  return (
    <article
      className="rounded-2xl border px-4 py-4"
      style={{
        borderColor: border,
        background: "rgba(10,10,10,0.85)",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: gold }}>
        Insight
      </p>
      <h4 className="mt-1 font-serif text-base text-white">{insight.title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{insight.body}</p>
    </article>
  );
}
