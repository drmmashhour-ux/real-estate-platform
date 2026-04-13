import Link from "next/link";
import type { ReactNode } from "react";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";

export type UnifiedListerNavItem = { href: string; label: string; current?: boolean };

/**
 * Shared shell for “owner” dashboards: BNHUB host, FSBO seller, broker listing hub — same Prestige frame, hub-specific nav + children.
 */
export function UnifiedListerDashboardFrame({
  brandHref = "/",
  eyebrow,
  title,
  subtitle,
  navItems,
  sessionSignedIn,
  signInHref = "/auth/login",
  accountHref = "/dashboard",
  heroExtra,
  children,
}: {
  brandHref?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  navItems: UnifiedListerNavItem[];
  sessionSignedIn: boolean;
  signInHref?: string;
  accountHref?: string;
  heroExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#050505] text-neutral-100">
      <header className="sticky top-0 z-10 border-b border-premium-gold/15 bg-[#050505]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="min-w-0">
            <LecipmBrandLockup href={brandHref} variant="dark" density="compact" />
          </div>
          <nav className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3" aria-label="Hub navigation">
            {navItems.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={[
                  "lecipm-touch rounded-full px-3 py-2 text-xs font-semibold transition sm:text-sm",
                  item.current
                    ? "bg-premium-gold/15 text-premium-gold ring-1 ring-premium-gold/35"
                    : "text-neutral-400 hover:text-white",
                ].join(" ")}
                aria-current={item.current ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
            {sessionSignedIn ? (
              <Link
                href={accountHref}
                className="lecipm-touch rounded-full border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-xs font-semibold text-premium-gold hover:bg-premium-gold/15 sm:text-sm"
              >
                My account
              </Link>
            ) : (
              <Link
                href={signInHref}
                className="lecipm-touch rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-neutral-200 sm:text-sm"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <section className="lecipm-footer-glow border-b border-white/10 bg-[#080808]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold/85">{eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-neutral-400 sm:text-base">{subtitle}</p>
          {heroExtra ? <div className="mt-6">{heroExtra}</div> : null}
        </div>
      </section>

      <section className="bg-[#050505]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </section>
    </main>
  );
}

/** Shown when no owner context (not signed in and no demo id). Reuse on other listing dashboards for consistency. */
export function UnifiedListerDashboardEmpty({
  browseHref = "/bnhub/stays",
  browseLabel = "Browse stays",
  showDevHints = process.env.NODE_ENV === "development",
}: {
  browseHref?: string;
  browseLabel?: string;
  showDevHints?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-premium-gold/25 bg-black/50 p-8 text-center shadow-[0_0_48px_rgba(212,175,55,0.07)]">
      <p className="text-base font-medium text-neutral-200">Sign in to load your listings and activity</p>
      <p className="mt-2 text-sm text-neutral-500">
        Use the same account you use for BNHUB hosting or LECIPM seller tools.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/auth/login?next=/bnhub/host/dashboard"
          className="lecipm-prestige-pill lecipm-neon-white-muted lecipm-touch inline-flex min-h-[48px] items-center justify-center px-6 text-sm font-semibold"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup?next=/bnhub/host/dashboard"
          className="text-sm font-medium text-premium-gold/90 hover:text-premium-gold hover:underline"
        >
          Create an account
        </Link>
      </div>
      {showDevHints ? (
        <p className="mt-8 text-xs leading-relaxed text-neutral-600">
          Dev: set <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-neutral-400">NEXT_PUBLIC_DEMO_HOST_ID</code> or add{" "}
          <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-neutral-400">?ownerId=USER_ID</code> to the URL.
        </p>
      ) : null}
      <Link href={browseHref} className="mt-6 inline-block text-sm font-medium text-premium-gold hover:underline">
        ← {browseLabel}
      </Link>
    </div>
  );
}

/**
 * Stat tiles — same three-up pattern for host / seller / broker listing KPIs.
 */
export function UnifiedListerStatStrip({
  items,
}: {
  items: { label: string; value: string; valueClassName?: string }[];
}) {
  return (
    <div className="mb-10 grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-[inset_0_1px_0_rgba(212,175,55,0.06)]"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{item.label}</p>
          <p className={`mt-2 text-2xl font-semibold text-white sm:text-3xl ${item.valueClassName ?? ""}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
