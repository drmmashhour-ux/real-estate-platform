/**
 * Loading skeleton for `/admin` command center (KPI strip + table).
 */
export function AdminHomeSkeleton() {
  return (
    <div className="flex min-h-screen animate-pulse bg-[#050505] text-white">
      <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#0b0b0b] px-5 py-6 md:block">
        <div className="h-8 w-40 rounded bg-white/10" />
        <div className="mt-8 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-11 rounded-xl bg-white/5" />
          ))}
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 h-24 rounded-xl bg-white/5" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-white/10 bg-[#0b0b0b]" />
          ))}
        </div>
        <div className="mt-10 h-64 rounded-2xl border border-white/10 bg-[#0b0b0b]" />
      </main>
    </div>
  );
}
