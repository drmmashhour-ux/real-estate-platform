/**
 * Shown on public listings: user-supplied data; platform does not warrant accuracy.
 */
export function ListingUserProvidedDisclaimer({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      className={`rounded-xl border border-[#C9A646]/25 bg-[#0B0B0B]/80 px-3 py-2 text-[11px] leading-relaxed text-[#B3B3B3] ${className}`}
    >
      <p className="font-semibold text-[#C9A646]/90">Information provided by the user</p>
      <p className="mt-1">
        LECIPM does not verify every listing detail. The platform is not responsible for the accuracy of
        descriptions, photos, pricing, or availability — confirm directly with the host, broker, or seller.
      </p>
    </div>
  );
}
