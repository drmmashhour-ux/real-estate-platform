/** Instant shell for listing detail — improves perceived performance from ads / cold traffic. */
export default function ListingDetailLoading() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
        <div className="mt-6 aspect-[4/3] w-full animate-pulse rounded-2xl bg-white/[0.06] sm:aspect-[16/10]" />
        <div className="mt-8 space-y-3">
          <div className="h-9 max-w-xl animate-pulse rounded-lg bg-white/10" />
          <div className="h-4 max-w-md animate-pulse rounded bg-white/[0.06]" />
          <div className="h-10 max-w-[14rem] animate-pulse rounded-full bg-[#D4AF37]/25" />
        </div>
      </div>
    </div>
  );
}
