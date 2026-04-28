type Props = {
  label?: string;
  className?: string;
};

/** Centered loading indicator for route segments and full-page waits. */
export function PageSpinner({ label = "Loading…", className = "" }: Props) {
  return (
    <div
      className={`flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-16 ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-premium-gold/30 border-t-[var(--color-premium-gold)]"
        aria-hidden
      />
      <p className="text-sm text-premium-text-muted">{label}</p>
    </div>
  );
}
