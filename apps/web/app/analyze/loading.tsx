export default function AnalyzeLoading() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-slate-50 sm:py-12">
      <div className="mx-auto max-w-3xl animate-pulse space-y-6">
        <div className="h-4 w-40 rounded bg-[#1a1a1a]" />
        <div className="h-10 w-3/4 max-w-md rounded bg-[#1a1a1a]" />
        <div className="h-20 w-full rounded-xl bg-[#1a1a1a]" />
        <div className="h-[280px] w-full rounded-2xl border border-white/10 bg-[#121212]/80" />
      </div>
    </main>
  );
}
