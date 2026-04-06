import Link from "next/link";
import { DemoLinearFooter } from "@/components/demo/DemoLinearFooter";
import { DemoNav } from "@/components/demo/DemoNav";
import { requireDemoMode } from "@/src/modules/demo/demoGuard";
import { DEMO_SAFETY_COPY } from "@/src/modules/demo/demoSafety";

export const dynamic = "force-dynamic";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  requireDemoMode();

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 antialiased">
      <header className="border-b border-slate-800/80 bg-gradient-to-b from-slate-950 to-black/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-500/90">LECIPM · BNHub</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">Investor demo mode</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500">
              Presentation layer only — core product routes unchanged.{" "}
              <Link href="/" className="text-amber-400/90 hover:text-amber-300">
                Exit to site
              </Link>
            </p>
          </div>
          <div className="max-w-md rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-center text-[10px] font-medium leading-snug tracking-wide text-amber-200/90">
            Investor-safe · read-first · {DEMO_SAFETY_COPY}
          </div>
        </div>
        <DemoNav />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
      <DemoLinearFooter />
    </div>
  );
}
