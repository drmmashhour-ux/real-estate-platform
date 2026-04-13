import { PageSpinner } from "@/components/ui/PageSpinner";

export default function ListingsLoading() {
  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <div className="border-b border-white/10 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-700" />
          <div className="h-9 max-w-md animate-pulse rounded-lg bg-slate-800" />
          <div className="h-4 max-w-xl animate-pulse rounded bg-slate-800/80" />
        </div>
      </div>
      <PageSpinner label="Loading properties…" className="min-h-[50vh]" />
    </div>
  );
}
