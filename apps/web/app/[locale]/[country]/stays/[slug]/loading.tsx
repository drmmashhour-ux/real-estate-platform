/** Instant shell for BNHUB stay detail — improves perceived performance from ads / cold traffic. */
export default function StayDetailLoading() {
  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-300" />
        <div className="mt-6 aspect-[5/3] w-full animate-pulse rounded-2xl bg-neutral-200" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            <div className="h-8 max-w-lg animate-pulse rounded bg-neutral-200" />
            <div className="h-4 max-w-xl animate-pulse rounded bg-neutral-200/80" />
          </div>
          <div className="h-64 animate-pulse rounded-2xl border border-neutral-200 bg-white shadow-sm" />
        </div>
      </div>
    </div>
  );
}
