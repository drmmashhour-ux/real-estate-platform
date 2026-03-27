import Link from "next/link";
import { InvestorLogoutButton } from "@/components/investor/InvestorLogoutButton";

const GOLD = "#C9A646";

const links = [
  { href: "/investor/dashboard", label: "Dashboard" },
  { href: "/investor/finance", label: "Financial model" },
  { href: "/investor/qa", label: "Investor Q&A" },
  { href: "/investor/analytics", label: "Analytics" },
  { href: "/investor/market", label: "Market" },
  { href: "/investor/notifications", label: "Notifications" },
];

export function InvestorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-100">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/investor/dashboard" className="text-lg font-semibold tracking-tight" style={{ color: GOLD }}>
            LECIPM Investor
          </Link>
          <nav className="flex flex-wrap gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <InvestorLogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
