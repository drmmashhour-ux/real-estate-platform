"use client";

export type MapDisplayMode = "markers" | "priceHeatmap";

export function MapPriceLegend({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute bottom-3 left-3 z-[400] rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2 text-[11px] shadow-md backdrop-blur-sm ${className}`}
    >
      <p className="mb-1.5 font-semibold text-slate-800">Price intensity</p>
      <ul className="space-y-1 text-slate-600">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" aria-hidden />
          Low
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
          Medium
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" aria-hidden />
          High
        </li>
      </ul>
    </div>
  );
}
