type Row = {
  actionType: string;
  outcome: string;
  createdAt: string;
};

type Props = {
  rows: Row[];
};

export function DarlinkAutonomyExecutionTrail(props: Props) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">Recent execution records</h3>
      {props.rows.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">No recorded outcomes yet.</p>
      ) : (
        <ul className="mt-3 max-h-56 space-y-1 overflow-auto text-xs">
          {props.rows.map((r, i) => (
            <li key={`${r.actionType}-${i}`} className="flex justify-between gap-2 border-b border-stone-100 py-1">
              <span className="font-mono text-stone-800">{r.actionType}</span>
              <span className="text-stone-500">{r.outcome}</span>
              <span className="text-stone-400">{r.createdAt.slice(0, 16)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
