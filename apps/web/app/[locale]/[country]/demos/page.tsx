import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand/platform";
import { isDemoModeEnabled } from "@/src/modules/demo/demoGuard";
import { DEMO_LIVE_PATH_ORDER } from "@/src/modules/demo/demoConfig";
import { UNIFIED_LISTING_JOURNEY } from "@/lib/listings/unified-listing-journey";

export const metadata: Metadata = {
  title: `Demos & tours — ${PLATFORM_NAME}`,
  description: `Guided demos for investors, BNHUB stays, brokers, and new clients — ${PLATFORM_NAME} (${PLATFORM_CARREFOUR_NAME}).`,
};

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/40">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#B3B3B3]">{description}</p>
      <div className="mt-5 flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Cta({
  href,
  label,
  variant = "gold",
}: {
  href: string;
  label: string;
  variant?: "gold" | "ghost";
}) {
  const cls =
    variant === "gold"
      ? "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-premium-gold px-4 py-2.5 text-sm font-semibold text-black hover:brightness-110"
      : "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/90 hover:bg-white/5";
  return (
    <Link href={href} className={cls}>
      {label}
    </Link>
  );
}

export default function DemosHubPage() {
  const investorDemoAvailable = isDemoModeEnabled();

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-premium-gold">New to the platform</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Demos &amp; guided tours</h1>
          <p className="mt-4 max-w-2xl text-[#B3B3B3]">
            Everything in one place: investor sandbox, BNHUB stays, broker CRM walkthrough, and help resources. Pick a path
            below—most links work without an account; a few ask you to sign in for a realistic workspace.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        <Card
          title="Investor + BNHUB linear demo (presentation mode)"
          description="Seven steps from search to metrics—safe for live sessions. Requires demo mode on the server."
        >
          {!investorDemoAvailable ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
              Investor sandbox is off. Set{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-[11px]">DEMO_MODE_ENABLED=1</code> in{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-[11px]">apps/web</code>, restart the app,
              then use <strong className="text-amber-50">Start investor demo</strong> below.
            </p>
          ) : (
            <p className="text-xs text-emerald-400/90">Demo mode is on — you can open the full 7-step flow.</p>
          )}
          <ol className="list-decimal space-y-1 pl-5 text-xs text-slate-500">
            {DEMO_LIVE_PATH_ORDER.map((href) => (
              <li key={href}>
                <code className="text-slate-400">{href}</code>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2 pt-1">
            {investorDemoAvailable ? (
              <>
                <Cta href="/demo" label="Start investor demo" variant="gold" />
                <Cta href="/demo/compare" label="Compare deals (demo)" variant="ghost" />
              </>
            ) : (
              <span className="inline-flex min-h-[44px] items-center rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-500">
                Enable demo mode to unlock investor flows
              </span>
            )}
          </div>
        </Card>

        <Card
          title="Listings — one journey: full first time, faster after that"
          description="Sell-by-yourself (FSBO) and BNHUB host both use the same pattern: the first listing goes through the full wizard (verification, declaration, etc.). For the next listing, open Create with “from last” or add ?from=yourListingId — fields copy over; you edit what changed, then Save / Continue (BNHUB host uses Save & continue)."
        >
          <ul className="list-inside list-disc space-y-2 text-xs text-slate-400">
            <li>
              FSBO: <code className="text-slate-500">{UNIFIED_LISTING_JOURNEY.fsboCreatePath}</code> — from{" "}
              <Link href={UNIFIED_LISTING_JOURNEY.fsboListPath} className="text-premium-gold hover:underline">
                My listings
              </Link>
              , use <strong className="text-slate-300">Add listing (from last)</strong> when you already have one.
            </li>
            <li>
              BNHUB: <code className="text-slate-500">{UNIFIED_LISTING_JOURNEY.bnhubHostNewPath}?from=…</code> — same clone
              idea as host listings.
            </li>
            <li>Broker CRM inventory is tenant workspace data (demo map below) — not the same DB row as FSBO/BNHUB, but the same “full then iterate” idea in product training.</li>
          </ul>
          <div className="flex flex-wrap gap-2 pt-1">
            <Cta href="/dashboard/seller/create" label="FSBO create" variant="ghost" />
            <Cta href="/host/listings/new" label="BNHUB new listing" variant="ghost" />
          </div>
        </Card>

        <Card
          title="BNHUB — guests & hosts"
          description="Explore short-term stays, trips, and the host tools used to list and run a property."
        >
          <div className="flex flex-wrap gap-2">
            <Cta href="/bnhub" label="BNHUB home" />
            <Cta href="/bnhub/stays" label="Search stays" variant="ghost" />
            <Cta href="/bnhub/host/dashboard" label="Host dashboard" variant="ghost" />
            <Cta href="/host/listings" label="Host listings" variant="ghost" />
          </div>
        </Card>

        <Card
          title="Broker & deal workspace (seeded walkthrough)"
          description="After running the Prestige demo seed, use these links for CRM, offers, contracts, and deals. Sign in required."
        >
          <Cta href="/dashboard/demo" label="Open dashboard demo map" />
          <p className="text-xs text-slate-500">
            Admin view of the same links:{" "}
            <Link href="/dashboard/admin/demo" className="text-premium-gold hover:underline">
              /dashboard/admin/demo
            </Link>
          </p>
        </Card>

        <Card
          title="Trust & identity (BNHUB)"
          description="Upload test documents in development or when test mode is enabled."
        >
          <Cta href="/bnhub/verify-id" label="ID verification" variant="ghost" />
        </Card>

        <Card
          title="Learn the product"
          description="Help articles, onboarding, and the public marketplace."
        >
          <div className="flex flex-wrap gap-2">
            <Cta href="/help" label="Help center" variant="ghost" />
            <Cta href="/onboarding" label="Onboarding" variant="ghost" />
            <Cta href="/search" label="Property search" variant="ghost" />
          </div>
        </Card>

        <p className="text-center text-sm text-slate-500">
          <Link href="/" className="font-medium text-premium-gold hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
