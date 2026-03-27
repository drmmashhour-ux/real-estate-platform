"use client";

/**
 * Staging and/or investor demo — visible when `NEXT_PUBLIC_ENV=staging` or `NEXT_PUBLIC_DEMO_MODE` is set.
 */
export function StagingEnvironmentBanner() {
  const env = process.env.NEXT_PUBLIC_ENV;
  const demo =
    process.env.NEXT_PUBLIC_DEMO_MODE === "1" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const staging = env === "staging";
  if (!staging && !demo) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[200] border-b border-amber-500/50 bg-gradient-to-r from-amber-950 via-amber-900/95 to-amber-950 px-3 py-2.5 text-center shadow-sm backdrop-blur sm:py-2"
    >
      <p className="text-sm font-semibold tracking-tight text-amber-50 sm:text-base">
        Demo Environment – No real transactions
      </p>
      <p className="mt-0.5 text-[11px] font-normal text-amber-200/90 sm:text-xs">
        {demo
          ? "Safe browsing: payments and risky actions are restricted."
          : "Staging build — test data only; external services may differ from production."}
      </p>
    </div>
  );
}
