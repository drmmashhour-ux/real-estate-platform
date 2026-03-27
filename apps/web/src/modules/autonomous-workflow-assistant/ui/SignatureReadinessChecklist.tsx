"use client";

export function SignatureReadinessChecklist({ items }: { items: string[] }) {
  return (
    <ul className="list-inside list-disc space-y-1 text-xs text-slate-300">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}
