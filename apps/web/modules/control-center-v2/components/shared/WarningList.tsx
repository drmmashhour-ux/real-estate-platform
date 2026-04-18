"use client";

export function WarningList({ items, title = "Warnings" }: { items: string[]; title?: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-medium text-amber-200/90">{title}</h3>
      <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-zinc-400">
        {items.map((w) => (
          <li key={w} className="border-b border-zinc-800/50 py-0.5">
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}
