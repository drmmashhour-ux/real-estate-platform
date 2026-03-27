/** Compact trust row for Immo listing contact (broker funnel). */
export function ImmoContactTrustRow() {
  const items = [
    { t: "Verified broker", s: "Licensed network" },
    { t: "Fast response", s: "Usually within minutes" },
    { t: "Secure inquiry", s: "Encrypted · No spam" },
  ];
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-xl border border-slate-800/80 bg-slate-900/60 px-2 py-2"
      role="group"
      aria-label="Trust"
    >
      {items.map((x) => (
        <div key={x.t} className="flex items-center gap-1.5 text-start">
          <span className="text-emerald-400" aria-hidden>
            ✓
          </span>
          <div>
            <p className="text-[10px] font-semibold text-slate-200">{x.t}</p>
            <p className="text-[9px] text-slate-500">{x.s}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
