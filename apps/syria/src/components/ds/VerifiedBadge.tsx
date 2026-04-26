import { cn } from "@/lib/cn";

/** Subtle trust indicator — listing reviewed / featured; not a legal guarantee. */
export function VerifiedBadge({ className, label }: { className?: string; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-[color:var(--darlink-accent)]/10 px-2.5 py-1 text-xs font-semibold text-[color:var(--darlink-accent)] ring-1 ring-[color:var(--darlink-accent)]/20",
        className,
      )}
    >
      <svg className="size-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </span>
  );
}
