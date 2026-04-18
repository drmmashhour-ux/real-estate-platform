"use client";

export function NegotiationActionBar({ onRun }: { onRun: () => void }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white"
        onClick={onRun}
      >
        Run copilot
      </button>
    </div>
  );
}
