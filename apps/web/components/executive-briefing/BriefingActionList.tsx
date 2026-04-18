"use client";

export function BriefingActionList({ items }: { items: string[] }) {
  return (
    <ol className="list-decimal space-y-1 pl-4 text-sm text-zinc-200">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ol>
  );
}
