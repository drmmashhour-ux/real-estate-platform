type Kpis = {
  avgTrust: number | null;
  avgDeal: number | null;
  activeListings: number;
  opportunitiesFound: number;
};

export function PremiumKpiBar({ kpis }: { kpis: Kpis }) {
  const items: { label: string; value: string; hint?: string }[] = [
    { label: "Trust (avg)", value: kpis.avgTrust != null ? String(kpis.avgTrust) : "—", hint: "Across your listings" },
    { label: "Deal (avg)", value: kpis.avgDeal != null ? String(kpis.avgDeal) : "—", hint: "Latest analyses" },
    { label: "Active listings", value: String(kpis.activeListings) },
    { label: "Opportunities", value: String(kpis.opportunitiesFound), hint: "High-score or favorable signal" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/[0.08] bg-[#141414] px-5 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C9A646]/90">{item.label}</p>
          <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-white">{item.value}</p>
          {item.hint ? <p className="mt-1 text-xs text-slate-500">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
