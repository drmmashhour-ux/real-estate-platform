"use client";

/**
 * Accessible inline hint: visible label + tooltip on hover/focus (native `title` + description id for SR).
 */
export function MetricHint({
  id,
  label,
  hint,
  className = "",
}: {
  id: string;
  label: string;
  hint: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span id={id}>{label}</span>
      <span
        className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-white/20 bg-white/5 text-[10px] font-bold text-slate-400"
        title={hint}
        tabIndex={0}
        role="img"
        aria-label={hint}
      >
        ?
      </span>
    </span>
  );
}
