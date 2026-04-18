"use client";

export function WarRoomBlockerList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-3">
      <h4 className="text-[10px] font-semibold uppercase text-rose-200/70">{title}</h4>
      <ul className="mt-2 space-y-1 text-xs text-zinc-300">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
