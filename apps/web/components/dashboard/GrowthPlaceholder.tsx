/** Placeholder “chart” for broker dashboard — subtle, professional until real analytics ship */
export function GrowthPlaceholder({ accent = "#14b8a6" }: { accent?: string }) {
  const bars = [40, 65, 45, 80, 55, 90, 70];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-sm font-semibold text-slate-200">Activity (7 days)</h3>
      <p className="mt-1 text-xs text-slate-500">Illustrative bars — connect your analytics source later.</p>
      <div className="mt-4 flex h-28 items-end justify-between gap-2" role="img" aria-label="Activity trend placeholder">
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-full max-w-[2rem] rounded-t-md transition duration-300 hover:opacity-90"
            style={{
              height: `${h}%`,
              background: `linear-gradient(180deg, ${accent}aa 0%, ${accent}44 100%)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
