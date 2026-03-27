import type { FutureOutcomeDocumentItem } from "@/src/modules/future-outcome-simulator/domain/futureOutcome.types";

export function RequiredDocumentsList({ documents }: { documents: FutureOutcomeDocumentItem[] }) {
  if (!documents.length) return null;
  return (
    <ul className="space-y-2">
      {documents.map((d) => (
        <li key={d.id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
          <p className="text-sm font-medium text-slate-200">{d.label}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{d.reason}</p>
        </li>
      ))}
    </ul>
  );
}
