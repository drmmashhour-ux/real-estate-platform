import { PageSpinner } from "@/components/ui/PageSpinner";

/** Country-scoped routes (home, listings, BNHub, dashboards) — consistent first paint. */
export default function CountryRouteLoading() {
  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <div className="border-b border-white/10 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-9 max-w-md animate-pulse rounded-lg bg-white/[0.07]" />
          <div className="h-4 max-w-xl animate-pulse rounded bg-white/[0.05]" />
        </div>
      </div>
      <PageSpinner label="Loading…" className="min-h-[42vh]" />
    </div>
  );
}
