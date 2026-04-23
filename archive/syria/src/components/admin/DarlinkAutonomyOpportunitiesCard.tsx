type Opp = {
  id: string;
  title: string;
  rationale: string;
  priority: number;
};

type Props = {
  opportunities: Opp[];
  max?: number;
};

export function DarlinkAutonomyOpportunitiesCard(props: Props) {
  const rows = props.opportunities.slice(0, props.max ?? 12);
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">Top opportunities</h3>
      <ul className="mt-3 space-y-2 text-sm text-stone-700">
        {rows.length === 0 ? (
          <li className="text-stone-500">No opportunities derived for this build.</li>
        ) : (
          rows.map((o) => (
            <li key={o.id} className="rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-2">
              <p className="font-medium text-stone-900">{o.title}</p>
              <p className="text-xs text-stone-600">{o.rationale}</p>
              <p className="mt-1 text-[10px] uppercase text-stone-400">priority {o.priority}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
