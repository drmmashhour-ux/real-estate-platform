"use client";

export function AutonomyActionDetail({
  id,
  rationale,
  candidateJson,
}: {
  id: string;
  rationale: string | null;
  candidateJson: unknown;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-slate-300">
      <p className="font-mono text-[10px] text-slate-500">{id}</p>
      {rationale ? <p className="mt-2 text-slate-200">{rationale}</p> : null}
      <pre className="mt-3 max-h-64 overflow-auto rounded bg-black/50 p-2 text-[10px] text-slate-400">
        {JSON.stringify(candidateJson, null, 2)}
      </pre>
    </div>
  );
}
