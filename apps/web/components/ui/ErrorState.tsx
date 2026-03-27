"use client";

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

/** API / network error with optional retry — surfaces failures instead of silent console-only. */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-rose-500/30 bg-rose-950/20 px-6 py-8 text-center ${className}`.trim()}
      role="alert"
    >
      <p className="text-sm font-semibold text-rose-200">{title}</p>
      <p className="mt-2 text-sm text-rose-100/80">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-[#C9A646] px-6 py-2.5 text-sm font-bold text-[#0B0B0B] transition hover:bg-[#D4B35A]"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
