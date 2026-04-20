"use client";

export function QuebecComplianceIssuesList({
  blockingIds,
  warnings,
}: {
  blockingIds: string[];
  warnings: string[];
}) {
  if (blockingIds.length === 0 && warnings.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-500">No blocking issues recorded.</div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {blockingIds.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/80">Blocking items</p>
          <ul className="mt-1 list-inside list-disc text-zinc-300">
            {blockingIds.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {warnings.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Warnings</p>
          <ul className="mt-1 list-inside list-disc text-zinc-400">
            {warnings.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
