import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function HostMarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo showName className="text-white [&_span]:text-white" />
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/bnhub/host/dashboard" className="text-zinc-400 hover:text-white">
              Host dashboard
            </Link>
            <Link href="/bnhub/host/marketing" className="font-medium text-amber-400">
              Marketing
            </Link>
            <Link href="/bnhub/stays" className="text-zinc-400 hover:text-white">
              Stays
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </main>
  );
}
