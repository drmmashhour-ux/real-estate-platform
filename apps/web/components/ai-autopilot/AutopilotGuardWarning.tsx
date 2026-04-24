"use client";

export function AutopilotGuardWarning({ message, messageFr }: { message: string; messageFr?: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-500/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100"
    >
      <p className="font-medium text-amber-200">Guard — action blocked</p>
      <p className="mt-1 text-amber-100/90">{message}</p>
      {messageFr && <p className="mt-2 text-xs text-amber-200/80">{messageFr}</p>}
    </div>
  );
}
