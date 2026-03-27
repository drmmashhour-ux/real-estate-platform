type Props = {
  sectionStatuses: Array<{ sectionKey: string; ready: boolean; missing: string[] }>;
};

export function SectionReviewPanel({ sectionStatuses }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Section review</p>
      <ul className="mt-2 space-y-1 text-xs text-slate-300">
        {sectionStatuses.length
          ? sectionStatuses.map((s) => (
              <li key={s.sectionKey}>
                <span className={s.ready ? "text-emerald-200" : "text-amber-200"}>{s.sectionKey.replace(/_/g, " ")}</span>
                {s.missing.length ? <span className="text-slate-500"> - missing: {s.missing.join(", ")}</span> : null}
              </li>
            ))
          : <li className="text-slate-500">No section status available.</li>}
      </ul>
    </div>
  );
}
