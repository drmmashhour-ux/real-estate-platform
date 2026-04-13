import Link from "next/link";
import { InvestorDemoClient } from "@/components/demo/InvestorDemoClient";
import { DEMO_LIVE_PATH_ORDER } from "@/src/modules/demo/demoConfig";

export const dynamic = "force-dynamic";

export default function DemoHomePage() {
  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-black to-slate-950 p-8 shadow-xl shadow-amber-950/20">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">LECIPM + BNHUB Investor Demo</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Follow this exact order live (footer <strong className="text-slate-300">Continue</strong> matches it). Step 3 uses{" "}
          <code className="text-amber-400/90">/demo/property/[id]</code> — default id <code className="text-amber-400/90">bnhub</code>{" "}
          from search, or open any card then continue.
        </p>
        <ol className="mt-5 list-decimal space-y-1 pl-5 font-mono text-xs text-slate-500 sm:text-sm">
          {DEMO_LIVE_PATH_ORDER.map((href, i) => (
            <li key={href}>
              {i === 2 ? (
                <>
                  <span className="text-slate-300">/demo/property/[id]</span>
                  <span className="text-slate-600"> — default </span>
                  <Link href={href} className="text-amber-400/90 hover:text-amber-300">
                    {href}
                  </Link>
                </>
              ) : (
                <Link href={href} className="text-amber-400/90 hover:text-amber-300">
                  {href}
                </Link>
              )}
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/demo/search"
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400"
          >
            Start demo
          </Link>
          <Link
            href="/demo/metrics"
            className="rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            Jump to metrics
          </Link>
          <Link
            href="/demos"
            className="rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
          >
            All demos &amp; tours
          </Link>
        </div>
      </div>

      <InvestorDemoClient highlightStep={null} />
    </div>
  );
}
