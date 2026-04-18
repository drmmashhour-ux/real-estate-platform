"use client";

export function ModePriorityList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/70">{title}</h4>
      <ul className="mt-2 space-y-1 text-xs text-zinc-300">
        {(items.length ? items : ["—"]).map((x, i) => (
          <li key={i} className="rounded border border-zinc-800/60 px-2 py-1">
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}
