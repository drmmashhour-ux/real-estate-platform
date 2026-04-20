import type { ProposedAction } from "@/modules/autonomous-marketplace/types/domain.types";

export function ListingPreviewActionsCard({ actions }: { actions: ProposedAction[] }) {
  if (!actions.length) {
    return (
      <p className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3 text-xs text-zinc-500">
        No proposed preview actions — blocked or absent.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {actions.map((a) => (
        <li key={a.id} className="rounded-lg border border-zinc-800 bg-[#111] p-3 text-xs text-zinc-300">
          <p className="font-semibold text-zinc-100">{a.title}</p>
          <p className="mt-1 text-zinc-500">{a.type}</p>
          <p className="mt-2 text-[10px] text-zinc-600">
            {typeof a.metadata?.previewReason === "string" ? a.metadata.previewReason : a.humanReadableSummary}
          </p>
        </li>
      ))}
    </ul>
  );
}
