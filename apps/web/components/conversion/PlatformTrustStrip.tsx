import type { ReactNode } from "react";

const DEFAULT_ITEMS = [
  "Verified listing where marked",
  "No hidden fees on platform tools",
  "Secure inquiry & payments where applicable",
] as const;

/**
 * Compact trust line — black + gold LECIPM pattern.
 */
export function PlatformTrustStrip({
  items = DEFAULT_ITEMS,
  updatedLabel,
  className = "",
}: {
  items?: readonly string[];
  updatedLabel?: string | null;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-800/80 bg-black/40 px-4 py-3 text-center ${className}`}
      role="note"
    >
      <ul className="flex flex-col flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-400 sm:flex-row">
        {items.map((t) => (
          <li key={t} className="inline-flex items-center gap-1.5">
            <span className="text-[#D4AF37]" aria-hidden>
              ✔
            </span>
            {t}
          </li>
        ))}
        {updatedLabel ? (
          <li className="text-gray-500">
            <span className="text-gray-600">·</span> {updatedLabel}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export function AiHintPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#E8D589]">
      {children}
    </span>
  );
}
