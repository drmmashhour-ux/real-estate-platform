"use client";

export function OpportunityList({ items, title }: { items: string[]; title: string }) {
  if (items.length === 0) return <p className="text-xs text-zinc-600">—</p>;
  return (
    <div>
      <h3 className="text-xs font-medium text-emerald-200/90">{title}</h3>
      <ul className="mt-2 space-y-1 text-xs text-zinc-300">
        {items.map((x) => (
          <li key={x} className="border-b border-zinc-800/40 pb-1">
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}
