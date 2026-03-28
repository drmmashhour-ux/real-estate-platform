"use client";

import { usePathname, useRouter } from "next/navigation";

/**
 * Global Back / Next controls (browser history). Placed to avoid FAB overlap.
 */
export function BrowserHistoryNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/embed")) return null;

  return (
    <div
      className="pointer-events-auto fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] start-4 z-[48] flex gap-1 rounded-full border border-white/12 bg-[#0B0B0B]/92 px-1 py-1 shadow-lg shadow-black/40 backdrop-blur-md sm:bottom-[calc(6.5rem+env(safe-area-inset-bottom))] sm:start-6"
      role="navigation"
      aria-label="Page history"
    >
      <button
        type="button"
        onClick={() => router.back()}
        className="min-h-[44px] min-w-[44px] rounded-full px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold/60"
        aria-label="Back to previous page"
      >
        Back
      </button>
      <button
        type="button"
        onClick={() => router.forward()}
        className="min-h-[44px] min-w-[44px] rounded-full px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold/60"
        aria-label="Forward to next page"
      >
        Next
      </button>
    </div>
  );
}
