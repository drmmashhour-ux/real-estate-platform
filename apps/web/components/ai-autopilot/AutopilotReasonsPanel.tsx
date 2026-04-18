"use client";

export function AutopilotReasonsPanel({ reasons }: { reasons: unknown }) {
  if (reasons == null || typeof reasons !== "object") {
    return null;
  }
  const r = reasons as Record<string, unknown>;
  return (
    <div className="mt-3 rounded-lg border border-zinc-800/80 bg-black/20 p-3 text-xs text-zinc-400">
      <p className="font-semibold text-zinc-300">Why this action</p>
      {typeof r.whyItMatters === "string" ? (
        <p className="mt-2 rounded border border-emerald-900/30 bg-emerald-950/20 p-2 text-emerald-100/90">
          <span className="font-medium text-emerald-300/90">Why this matters — </span>
          {r.whyItMatters}
        </p>
      ) : null}
      <ul className="mt-2 list-inside list-disc space-y-1">
        {typeof r.triggeredBy === "string" ? <li>Trigger: {r.triggeredBy}</li> : null}
        {typeof r.expectedBenefit === "string" ? <li>Expected: {r.expectedBenefit}</li> : null}
        {Array.isArray(r.cautions) && r.cautions.length > 0 ? (
          <li className="text-amber-200/90">Cautions: {(r.cautions as string[]).join(" · ")}</li>
        ) : null}
      </ul>
    </div>
  );
}
