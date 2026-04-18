import * as React from "react";

export type PlatformTrustStripLine = { key: string; label: string };

type PlatformTrustStripProps = {
  lines: PlatformTrustStripLine[];
  className?: string;
  "aria-label"?: string;
};

/**
 * Compact horizontal trust hints — pass only lines backed by real data (see `buildTrustStripLines`).
 */
export function PlatformTrustStrip({
  lines,
  className = "",
  "aria-label": ariaLabel = "Trust signals",
}: PlatformTrustStripProps) {
  if (!lines.length) return null;
  return (
    <ul
      className={`flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400 ${className}`}
      aria-label={ariaLabel}
    >
      {lines.map((line) => (
        <li key={line.key} className="inline-flex items-center gap-1">
          <span className="text-emerald-500/90" aria-hidden>
            ✓
          </span>
          <span>{line.label}</span>
        </li>
      ))}
    </ul>
  );
}
