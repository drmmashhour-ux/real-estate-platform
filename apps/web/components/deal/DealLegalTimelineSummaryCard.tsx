"use client";

type DealLegalSummary = {
  dealId: string;
  currentStage: string;
  stages: Array<{ key: string; label: string; status: "completed" | "current" | "upcoming" }>;
  events: Array<{ id: string; createdAt: string; note: string | null; stage: string | null }>;
};

function badgeClasses(status: "completed" | "current" | "upcoming") {
  if (status === "completed") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "current") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-white/10 bg-black/20 text-slate-400";
}

export function DealLegalTimelineSummaryCard({
  summary,
  href,
  title = "Legal timeline",
}: {
  summary: DealLegalSummary;
  href?: string;
  title?: string;
}) {
  const current = summary.stages.find((stage) => stage.status === "current") ?? summary.stages[summary.stages.length - 1];
  const recent = summary.events[summary.events.length - 1] ?? null;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-premium-gold">{title}</p>
          <p className="mt-2 text-sm text-[#B3B3B3]">
            Current legal stage: <span className="font-semibold capitalize text-white">{current?.label ?? summary.currentStage.replace(/_/g, " ")}</span>
          </p>
        </div>
        {href ? (
          <a href={href} className="text-xs font-semibold text-premium-gold hover:underline">
            Open deal →
          </a>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {summary.stages.map((stage) => (
          <span key={stage.key} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeClasses(stage.status)}`}>
            {stage.label}
          </span>
        ))}
      </div>

      {recent ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs text-slate-500">{new Date(recent.createdAt).toLocaleString()}</p>
          <p className="mt-1 text-sm text-white">{recent.stage?.replace(/_/g, " ") ?? "Legal update recorded"}</p>
          {recent.note ? <p className="mt-1 text-xs text-slate-400">{recent.note}</p> : null}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">No legal-stage audit events recorded yet.</p>
      )}
    </section>
  );
}
