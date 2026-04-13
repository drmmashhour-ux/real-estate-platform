import Link from "next/link";

/** Short QA path for demo/seed listings — shown on explore landing map block. */
export function ExploreQaListingHint() {
  return (
    <details className="rounded-xl border border-white/10 bg-black/25 p-4 text-xs leading-relaxed text-white/70">
      <summary className="cursor-pointer font-semibold text-premium-gold/90">Test listings (local QA)</summary>
      <p className="mt-2">
        If <Link href="/listings" className="text-premium-gold hover:underline">/listings</Link> is empty, from the repo
        root run <code className="rounded bg-white/10 px-1 text-white/90">pnpm seed:demo</code> (quick demo data) or{" "}
        <code className="rounded bg-white/10 px-1 text-white/90">pnpm db:seed</code> (full simulation; includes{" "}
        <code className="text-white/90">guest@demo.com</code> for booking tests). Env notes:{" "}
        <code className="text-white/80">apps/web/.env.example</code>.
      </p>
    </details>
  );
}
