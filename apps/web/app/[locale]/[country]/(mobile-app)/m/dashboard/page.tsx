import Link from "next/link";

export default async function MobileDashboardHubPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const root = `/${locale}/${country}`;
  const dash = `${root}/dashboard`;

  const hubs = [
    { label: "Buyer", href: `${dash}/buyer` },
    { label: "Seller", href: `${dash}/seller` },
    { label: "Broker", href: `${dash}/broker` },
    { label: "Investor", href: `${dash}/investor` },
    { label: "BNHub", href: `${root}/bnhub` },
  ];

  return (
    <div className="px-4 pb-8 pt-6">
      <h1 className="text-xl font-semibold text-white">Hubs</h1>
      <p className="mt-2 text-sm text-white/50">Jump into your workspace.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {hubs.map((h) => (
          <Link
            key={h.label}
            href={h.href}
            className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]"
          >
            {h.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
