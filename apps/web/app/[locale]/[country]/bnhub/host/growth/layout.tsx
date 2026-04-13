import Link from "next/link";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";

export default function HostGrowthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <LecipmBrandLockup href="/bnhub" variant="dark" density="compact" />
          <nav className="flex flex-wrap gap-3 text-sm">
            <Link href="/bnhub/host/dashboard" className="text-zinc-400 hover:text-white">
              Host
            </Link>
            <span className="font-medium text-amber-400">Growth engine</span>
            <Link href="/bnhub/host/growth/leads" className="text-zinc-400 hover:text-white">
              Leads
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </main>
  );
}
