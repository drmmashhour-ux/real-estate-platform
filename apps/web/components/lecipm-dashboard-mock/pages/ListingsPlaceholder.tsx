import { MockButton, MockCard } from "@/components/lecipm-dashboard-mock/mock-ui";

const CARDS = [
  { addr: "3120 Rue Parthenais", mls: "QC-9283", price: "$514,900" },
  { addr: "8810 Av. Darwin", mls: "QC-7712", price: "$729,000" },
  { addr: "4150 Boul. Rosemont", mls: "QC-6610", price: "$398,000" },
];

export function ListingsPlaceholder() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Listings</h1>
        <p className="mt-1 text-sm text-ds-text-secondary">Inventory snapshot · open the assistant for copy &amp; export</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {CARDS.map((c) => (
          <MockCard key={c.mls} className="hover:border-ds-gold/35 hover:shadow-[0_0_32px_rgba(212,175,55,0.1)]">
            <p className="text-xs uppercase tracking-wide text-ds-text-secondary">{c.mls}</p>
            <p className="mt-2 font-semibold text-white">{c.addr}</p>
            <p className="mt-3 text-lg font-bold text-ds-gold">{c.price}</p>
            <MockButton className="mt-4 w-full justify-center">Open</MockButton>
          </MockCard>
        ))}
      </div>
    </div>
  );
}
