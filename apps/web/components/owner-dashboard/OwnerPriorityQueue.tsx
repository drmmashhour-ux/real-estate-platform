import type { OwnerPriority } from "@/modules/owner-dashboard/owner-dashboard.types";

export function OwnerPriorityQueue({ priorities }: { priorities: OwnerPriority[] }) {
  return (
    <div className="rounded-xl border border-amber-900/35 bg-black/50 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Priorités suggérées</h3>
      <ol className="mt-3 list-decimal space-y-3 pl-4 text-sm text-zinc-300">
        {priorities.map((p) => (
          <li key={p.id}>
            <span className="font-medium text-amber-100/90">{p.title}</span>
            <p className="mt-1 text-xs text-zinc-500">{p.rationale}</p>
            <p className="mt-1 text-xs text-amber-200/70">{p.suggestedAction}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
