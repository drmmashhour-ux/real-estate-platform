import type { InstantValueIntent } from "@/modules/conversion/instant-value.types";

const DEFAULT_LINES = [
  "Verified listings where marked",
  "Secure platform",
  "Real opportunities — no fake scarcity",
  "No hidden browse fees",
];

type Props = {
  lines?: string[];
  className?: string;
  /** Optional — reserved for analytics; does not change copy in V1 */
  intent?: InstantValueIntent;
};

/**
 * Compact trust line row — only supported statements (or caller-provided lines from instant-value service).
 */
export function TrustStrip({ lines = DEFAULT_LINES, className = "" }: Props) {
  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400 sm:text-sm ${className}`}
      aria-label="Trust"
    >
      {lines.slice(0, 6).map((line) => (
        <li key={line} className="flex items-center gap-1.5">
          <span className="text-premium-gold" aria-hidden>
            ✓
          </span>
          {line}
        </li>
      ))}
    </ul>
  );
}
