export function TrustDealSummaryCard({
  trustScore,
  dealScore,
  confidence,
  reasons = [],
  appearance = "dark",
}: {
  trustScore: number | null;
  dealScore: number | null;
  confidence: "low" | "medium" | "high";
  reasons?: string[];
  /** `light` for portal-style (e.g. Centris-inspired) landing sections */
  appearance?: "dark" | "light";
}) {
  const isLight = appearance === "light";
  return (
    <article
      className={
        isLight
          ? "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          : "rounded-xl border border-white/10 bg-black/40 p-4"
      }
    >
      <p className={`text-xs uppercase tracking-wide ${isLight ? "text-amber-700" : "text-premium-gold"}`}>
        Decision Snapshot
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Score title="Trust Score" value={trustScore} appearance={appearance} />
        <Score title="Deal Score" value={dealScore} appearance={appearance} />
      </div>
      <p className={`mt-3 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Confidence: {confidence}</p>
      {reasons.length ? (
        <ul
          className={`mt-3 list-disc space-y-1 pl-5 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}
        >
          {reasons.slice(0, 4).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function Score({
  title,
  value,
  appearance = "dark",
}: {
  title: string;
  value: number | null;
  appearance?: "dark" | "light";
}) {
  const v = value ?? 0;
  const isLight = appearance === "light";
  const color = isLight
    ? v >= 75
      ? "text-emerald-600"
      : v >= 50
        ? "text-amber-600"
        : "text-rose-600"
    : v >= 75
      ? "text-emerald-300"
      : v >= 50
        ? "text-amber-200"
        : "text-rose-300";
  return (
    <div
      className={
        isLight
          ? "rounded-lg border border-slate-200 bg-slate-50 p-3"
          : "rounded-lg border border-white/10 bg-[#0b0b0c] p-3"
      }
    >
      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>{title}</p>
      <p className={`mt-1 text-3xl font-semibold ${color}`}>{value ?? "—"}</p>
    </div>
  );
}
