import { MobileTabletSplit } from "@/components/mobile/mobile-tablet-split";

export default async function MobileSearchPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}`;

  const filters = (
    <div className="space-y-3 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/78">Filters</p>
      {["Price", "Beds", "Neighbourhood", "Product type"].map((f) => (
        <button
          key={f}
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-left text-sm text-white/80"
        >
          {f}
          <span className="text-white/35">▾</span>
        </button>
      ))}
    </div>
  );

  const list = (
    <div className="space-y-3 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[#D4AF37]/78">Results</p>
      {[1, 2, 3].map((i) => (
        <a
          key={i}
          href={`${base}/m/listing/demo-${i}`}
          className="block rounded-2xl border border-white/10 bg-[#0D0D0D] p-4"
        >
          <div className="aspect-[16/10] rounded-xl bg-white/5" />
          <p className="mt-3 font-medium text-white">Signature residence {i}</p>
          <p className="mt-1 text-sm text-[#D4AF37]">$1,240,000 · Montréal</p>
        </a>
      ))}
    </div>
  );

  const mapOrDetail = (
    <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-[#0B0B0B] text-sm text-white/35 md:min-h-0">
      Map / detail pane (tablet+)
    </div>
  );

  return (
    <div className="pb-4 pt-4">
      <h1 className="px-4 text-xl font-semibold text-white">Search</h1>
      <p className="mt-1 px-4 text-sm text-white/45">Tablet shows split view; phone stacks list then detail.</p>
      <div className="mt-6">
        <MobileTabletSplit sidebar={filters} main={list} wide={mapOrDetail} />
      </div>
    </div>
  );
}
