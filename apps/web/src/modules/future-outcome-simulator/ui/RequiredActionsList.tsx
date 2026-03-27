import type { FutureOutcomeActionItem } from "@/src/modules/future-outcome-simulator/domain/futureOutcome.types";

const roleLabel: Record<FutureOutcomeActionItem["role"], string> = {
  buyer: "Buyer",
  broker: "Broker",
  seller_side: "Seller side",
  any: "Team",
};

export function RequiredActionsList({ actions }: { actions: FutureOutcomeActionItem[] }) {
  if (!actions.length) return null;
  return (
    <ul className="space-y-2">
      {actions.map((a) => (
        <li key={a.id} className="flex gap-2 text-xs text-slate-300">
          <span className="shrink-0 rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {roleLabel[a.role]}
          </span>
          <span className="leading-relaxed">{a.label}</span>
        </li>
      ))}
    </ul>
  );
}
