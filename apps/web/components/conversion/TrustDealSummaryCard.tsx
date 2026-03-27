export function TrustDealSummaryCard({
  trustScore,
  dealScore,
  confidence,
  reasons = [],
}: {
  trustScore: number | null;
  dealScore: number | null;
  confidence: "low" | "medium" | "high";
  reasons?: string[];
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/40 p-4">
      <p className="text-xs uppercase tracking-wide text-[#C9A646]">Decision Snapshot</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Score title="Trust Score" value={trustScore} />
        <Score title="Deal Score" value={dealScore} />
      </div>
      <p className="mt-3 text-xs text-slate-400">Confidence: {confidence}</p>
      {reasons.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
          {reasons.slice(0, 4).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function Score({ title, value }: { title: string; value: number | null }) {
  const v = value ?? 0;
  const color = v >= 75 ? "text-emerald-300" : v >= 50 ? "text-amber-200" : "text-rose-300";
  return (
    <div className="rounded-lg border border-white/10 bg-[#0b0b0c] p-3">
      <p className="text-xs text-slate-400">{title}</p>
      <p className={`mt-1 text-3xl font-semibold ${color}`}>{value ?? "—"}</p>
    </div>
  );
}
