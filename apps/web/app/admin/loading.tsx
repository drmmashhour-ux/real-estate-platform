/**
 * Admin segment loading UI — generic so sub-routes (dashboard, monetization, etc.) are not mislabeled as command center.
 */
export default function AdminSegmentLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-[#050505] px-4 text-white/50">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37]" aria-hidden />
      <p className="text-sm">Loading admin…</p>
    </div>
  );
}
