"use client";

export type AutopilotSuggestionRow = {
  id: string;
  type: string;
  confidence: number;
  impactEstimate: number;
  status: string;
  explanation: unknown;
  createdAt: string;
};

export function AutopilotSuggestionsPanel({ items }: { items: AutopilotSuggestionRow[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No pending suggestions — update the listing or run autopilot from the seller dashboard.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((s) => (
        <li key={s.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-white">{s.type}</span>
            <span className="text-xs text-slate-500">{s.status}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            confidence {(s.confidence * 100).toFixed(0)}% · impact est. {(s.impactEstimate * 100).toFixed(0)}%
          </p>
          <pre className="mt-2 max-h-32 overflow-auto text-xs text-slate-500">
            {JSON.stringify(s.explanation, null, 2)}
          </pre>
        </li>
      ))}
    </ul>
  );
}
