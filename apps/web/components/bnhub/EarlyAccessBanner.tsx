export function EarlyAccessBanner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-violet-500/35 bg-violet-950/40 px-4 py-3 text-center sm:px-6 sm:text-left ${className}`}
      role="status"
    >
      <p className="text-sm font-medium text-violet-100">
        BNHub is in early access in Montréal / Laval.
      </p>
      <p className="mt-1 text-xs text-violet-200/80">
        We show real activity only — saves and views come from actual guests. No fake bookings or reviews.
      </p>
    </div>
  );
}
