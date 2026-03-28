"use client";

type Props = {
  onCopy: () => void;
  onRetry: () => void;
  onHelpful: () => void;
  onNotHelpful: () => void;
  busy?: boolean;
  disabledFeedback?: boolean;
};

export function AIActionBar({ onCopy, onRetry, onHelpful, onNotHelpful, busy, disabledFeedback }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={onCopy}
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-40"
      >
        Copy
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onRetry}
        className="rounded-lg border border-white/15 bg-transparent px-3 py-1.5 text-xs text-premium-gold hover:bg-premium-gold/10 disabled:opacity-40"
      >
        Retry
      </button>
      <span className="text-[10px] uppercase tracking-wide text-slate-600">Feedback</span>
      <button
        type="button"
        disabled={busy || disabledFeedback}
        onClick={onHelpful}
        className="rounded-lg border border-emerald-500/30 px-2 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
      >
        Helpful
      </button>
      <button
        type="button"
        disabled={busy || disabledFeedback}
        onClick={onNotHelpful}
        className="rounded-lg border border-rose-500/30 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/10 disabled:opacity-40"
      >
        Not helpful
      </button>
    </div>
  );
}
