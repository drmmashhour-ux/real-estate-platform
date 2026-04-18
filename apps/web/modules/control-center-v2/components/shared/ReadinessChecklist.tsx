"use client";

export function ReadinessChecklist({
  items,
}: {
  items: { label: string; ok: boolean; na?: boolean }[];
}) {
  return (
    <ul className="space-y-1 text-xs">
      {items.map((i) => (
        <li key={i.label} className="flex justify-between gap-2 text-zinc-300">
          <span>{i.label}</span>
          {i.na ? (
            <span className="text-zinc-500">N/A</span>
          ) : (
            <span className={i.ok ? "text-emerald-400" : "text-rose-400"}>{i.ok ? "OK" : "Not OK"}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
