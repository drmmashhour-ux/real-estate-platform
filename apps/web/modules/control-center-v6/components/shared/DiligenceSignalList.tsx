"use client";

export function DiligenceSignalList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-[10px] font-semibold uppercase text-zinc-500">{title}</h4>
      <ul className="mt-2 space-y-1.5 text-xs text-zinc-300">
        {(items.length ? items : ["—"]).map((x, i) => (
          <li key={i} className="leading-snug">
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}
