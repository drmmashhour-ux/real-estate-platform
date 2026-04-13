export default function SharedDealLoading() {
  return (
    <div className="min-h-[60vh] animate-pulse bg-[#0B0B0B] px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-10 w-3/4 rounded-lg bg-white/10" />
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-48 rounded-2xl bg-white/5" />
          <div className="h-48 rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
