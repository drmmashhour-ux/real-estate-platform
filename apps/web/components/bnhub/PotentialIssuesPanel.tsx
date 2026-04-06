import Link from "next/link";

export type PotentialIssueRow = {
  id: string;
  bookingId: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  signalType: string;
  summary: string;
  createdAt: string;
  listingTitle: string;
};

const levelStyles: Record<PotentialIssueRow["riskLevel"], string> = {
  LOW: "border-slate-600 bg-slate-800/40 text-slate-200",
  MEDIUM: "border-amber-500/40 bg-amber-950/30 text-amber-100",
  HIGH: "border-red-500/40 bg-red-950/25 text-red-100",
};

export function PotentialIssuesPanel({ items }: { items: PotentialIssueRow[] }) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <h2 className="text-sm font-semibold text-white">Potential issues</h2>
      <p className="mt-1 text-xs text-slate-500">
        Early signals only — we don’t resolve disputes automatically. Use booking messages and official support if needed.
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500">{row.listingTitle}</p>
              <p className="mt-0.5 text-sm text-slate-200">{row.summary}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-slate-600">{row.signalType}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${levelStyles[row.riskLevel]}`}>
                {row.riskLevel}
              </span>
              <Link
                href={`/bnhub/booking/${row.bookingId}`}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
              >
                View booking →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
