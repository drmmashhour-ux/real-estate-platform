"use client";

export function ReadinessChecklist({ checklist }: { checklist: Record<string, boolean> }) {
  const entries = Object.entries(checklist);
  if (!entries.length) return <p className="text-xs text-zinc-500">—</p>;
  return (
    <ul className="space-y-1 text-xs">
      {entries.map(([k, v]) => (
        <li key={k} className="flex items-center gap-2 text-zinc-300">
          <span className={v ? "text-emerald-400" : "text-amber-400"}>{v ? "✓" : "○"}</span>
          <span className="text-zinc-400">{k}</span>
        </li>
      ))}
    </ul>
  );
}
