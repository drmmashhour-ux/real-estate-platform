export { SkeletonBlock as Skeleton, ListingsGridSkeleton } from "./SkeletonBlock";

/** Single-line placeholder */
export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`ds-shimmer h-4 rounded-md bg-[#E8E8E4]/90 ${className}`.trim()}
      aria-hidden
    />
  );
}

/** Card-shaped loading block */
export function SkeletonCardFrame() {
  return (
    <div className="overflow-hidden rounded-[var(--ds-radius-xl)] border border-[#D9D9D2]/80 bg-white p-5 shadow-sm">
      <div className="ds-shimmer mb-4 h-5 w-1/3 rounded-md bg-[#E8E8E4]" />
      <SkeletonLine className="mb-2 w-full" />
      <SkeletonLine className="w-4/5" />
    </div>
  );
}

/** Table row placeholder */
export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-4 border-b border-[#D9D9D2]/60 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonLine key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}
