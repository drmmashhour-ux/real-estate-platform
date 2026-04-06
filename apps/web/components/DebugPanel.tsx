"use client";

/**
 * Fixed launch-validation strip. Enable with `NEXT_PUBLIC_LAUNCH_DEBUG=1`.
 */
export function DebugPanel() {
  if (process.env.NEXT_PUBLIC_LAUNCH_DEBUG !== "1") return null;

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-[9999] flex justify-center px-3 pb-3"
      aria-hidden
    >
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 rounded-t-lg border border-amber-700/50 bg-amber-950/95 px-4 py-2 text-xs font-medium text-amber-100 shadow-lg backdrop-blur-sm">
        <span className="rounded bg-amber-900/80 px-2 py-0.5">Tracking ON</span>
        <span className="rounded bg-amber-900/80 px-2 py-0.5">Debug Active</span>
      </div>
    </div>
  );
}
