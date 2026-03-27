"use client";

export type ComplianceSummary = {
  dealsMissingDocuments: number;
  incompleteMilestones: number;
  legalFlags: number;
};

export function ComplianceTracker({ summary }: { summary: ComplianceSummary }) {
  const items = [
    { label: "Deals missing documents", count: summary.dealsMissingDocuments, tone: "amber" as const },
    { label: "Incomplete milestone steps", count: summary.incompleteMilestones, tone: "amber" as const },
    { label: "Legal / bypass flags", count: summary.legalFlags, tone: "rose" as const },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.label}
          className={`rounded-lg border px-4 py-3 ${
            it.tone === "rose"
              ? "border-rose-500/25 bg-rose-950/20"
              : "border-amber-500/25 bg-amber-950/15"
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{it.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${it.count > 0 ? "text-slate-100" : "text-slate-500"}`}>
            {it.count}
          </p>
        </div>
      ))}
    </div>
  );
}
