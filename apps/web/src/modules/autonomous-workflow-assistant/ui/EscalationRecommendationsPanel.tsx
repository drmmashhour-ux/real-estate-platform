"use client";

export function EscalationRecommendationsPanel({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-100">
      <p className="font-semibold text-rose-200">Escalation</p>
      <ul className="mt-1 list-inside list-disc">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
