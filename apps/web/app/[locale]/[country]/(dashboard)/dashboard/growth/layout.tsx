import Link from "next/link";
import { engineFlags } from "@/config/feature-flags";
import { listSeoLandingSlugs } from "@/modules/growth/seo/seo-page.service";

export default async function GrowthMachineLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard/growth`;

  if (!engineFlags.growthMachineV1) {
    return <div className="p-6 text-white">{children}</div>;
  }

  const demoSeoSlug = listSeoLandingSlugs()[0];
  const nav = [
    { href: base, label: "Overview" },
    {
      href: `/${locale}/${country}/growth-seo/${demoSeoSlug}`,
      label: "SEO landings",
    },
    { href: `${base}/campaigns`, label: "Campaigns" },
    { href: `${base}/leads`, label: "Leads" },
    { href: `${base}/listings`, label: "Listings" },
    { href: `${base}/automation`, label: "Automation" },
    { href: `${base}/reports`, label: "Reports" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 text-white">
      <nav className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
