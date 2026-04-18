"use client";

export function ReleaseReadinessCard({ ready, blockers }: { ready: boolean; blockers: string[] }) {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3 text-xs">
      <p className="font-medium text-amber-100">Release readiness: {ready ? "pass" : "blocked"}</p>
      {blockers.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-amber-200/80">
          {blockers.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
