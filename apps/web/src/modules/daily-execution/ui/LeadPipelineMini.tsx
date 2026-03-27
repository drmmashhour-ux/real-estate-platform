"use client";

const ORDER = [
  { key: "contacted", label: "Contacted" },
  { key: "replied", label: "Replied" },
  { key: "follow_up_sent", label: "Follow-up sent" },
  { key: "demo_booked", label: "Demo booked" },
] as const;

export function LeadPipelineMini({ pipeline }: { pipeline: Record<string, number> }) {
  const uncategorized = pipeline.uncategorized ?? 0;

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-5 text-slate-100">
      <h2 className="text-lg font-semibold">Lead coaching pipeline</h2>
      <p className="mt-1 text-xs text-slate-500">Counts for leads you introduced — set stage from follow-up actions or your CRM habit.</p>
      {uncategorized > 0 ? (
        <p className="mt-2 text-xs text-slate-400">
          Uncategorized: <span className="font-medium text-slate-200">{uncategorized}</span>
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ORDER.map(({ key, label }) => (
          <div key={key} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-center">
            <p className="text-lg font-semibold text-emerald-400">{pipeline[key] ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
