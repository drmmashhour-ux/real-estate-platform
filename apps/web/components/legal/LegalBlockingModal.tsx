"use client";

import Link from "next/link";

type Props = {
  open: boolean;
  title?: string;
  reasons: string[];
  blockingRequirements?: string[];
  locale: string;
  country: string;
  onClose: () => void;
};

/**
 * Reusable modal for HARD legal gate failures — explains why an action cannot proceed (no legal advice).
 */
export function LegalBlockingModal({
  open,
  title = "Action blocked — Legal Hub checklist",
  reasons,
  blockingRequirements,
  locale,
  country,
  onClose,
}: Props) {
  if (!open) return null;

  const hubHref = `/${locale}/${country}/legal`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-8">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-red-500/30 bg-[#121212] p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 text-xs text-[#9CA3AF]">
          The platform uses deterministic workflow checks only — not legal advice. Complete the items below in the Legal
          Hub, then retry.
        </p>
        {reasons.length > 0 ? (
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[#E5E7EB]">
            {reasons.map((r) => (
              <li key={r.slice(0, 120)}>{r}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[#9CA3AF]">No detailed reasons were returned — contact support with the time of the request.</p>
        )}
        {blockingRequirements && blockingRequirements.length > 0 ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-[#9CA3AF]">
            <p className="font-semibold text-[#D1D5DB]">Blocking keys</p>
            <ul className="mt-1 list-disc pl-4">
              {blockingRequirements.map((k) => (
                <li key={k} className="font-mono text-[10px]">
                  {k}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={hubHref}
            className="inline-flex items-center justify-center rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black"
          >
            Go to Legal Hub
          </Link>
          <button
            type="button"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
