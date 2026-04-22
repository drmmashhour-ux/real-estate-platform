import type { ReactNode } from "react";
import Link from "next/link";

const GOLD = "var(--color-premium-gold)";
const BG = "#0B0B0B";

export default async function AdminLegacyLaunchLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const dash = `/${locale}/${country}/dashboard`;

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <header className="border-b border-white/10 bg-black/50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
              Admin · Launch &amp; sales
            </p>
            <nav className="mt-2 flex flex-wrap gap-4 text-sm">
              <Link href={`${dash}/admin`} className="font-semibold hover:underline" style={{ color: GOLD }}>
                Operations
              </Link>
              <Link href={`${dash}/admin/sales`} className="text-[#B3B3B3] hover:text-white hover:underline">
                Sales scripts
              </Link>
              <Link href={`${dash}/admin/daily`} className="text-[#B3B3B3] hover:text-white hover:underline">
                Daily action
              </Link>
              <Link href={`${dash}/admin/kpi`} className="text-[#B3B3B3] hover:text-white hover:underline">
                KPIs
              </Link>
              <Link href={`${dash}/admin/content`} className="text-[#B3B3B3] hover:text-white hover:underline">
                Content &amp; traffic
              </Link>
              <Link
                href={`${dash}/admin/clients-acquisition`}
                className="text-[#B3B3B3] hover:text-white hover:underline"
              >
                First 10 clients
              </Link>
              <Link href={`${dash}/operators/waitlist`} className="text-[#B3B3B3] hover:text-white hover:underline">
                Operator waitlist
              </Link>
              <Link href={`/${locale}/${country}/admin`} className="text-xs text-[#737373] hover:text-[#B3B3B3]">
                ← Main admin
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
