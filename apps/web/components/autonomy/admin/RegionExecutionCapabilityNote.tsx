"use client";

/**
 * Displays a deterministic region-safe execution availability note for admin surfaces.
 */
export function RegionExecutionCapabilityNote(props: { note: string }) {
  return (
    <p className="rounded-lg border border-amber-900/40 bg-slate-950/60 px-3 py-2 text-xs text-amber-100/90">{props.note}</p>
  );
}
