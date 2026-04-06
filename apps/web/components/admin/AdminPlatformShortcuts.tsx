import Link from "next/link";

const SHORTCUTS: readonly { href: string; label: string; hint: string }[] = [
  { href: "/admin/listings", label: "Listings", hint: "Browse, review, and open listing tools" },
  { href: "/admin/listings/new", label: "New listing", hint: "Create a long-term / sale listing" },
  { href: "/admin/bnhub/stays/new", label: "New stay", hint: "Add a BNHub short-term stay" },
  { href: "/admin/bookings", label: "Bookings", hint: "BNHub reservations and payment status" },
  { href: "/admin/bnhub/finance/payments", label: "BNHub finance", hint: "Payments, payouts, holds" },
  { href: "/admin/users", label: "Users", hint: "Accounts and roles" },
  { href: "/admin/leads", label: "Leads", hint: "Lead pipeline and CRM" },
  { href: "/admin/insurance", label: "Insurance leads", hint: "Travel / property / mortgage partner handoffs" },
  { href: "/admin/launch", label: "Launch", hint: "Funnel events and milestones" },
  { href: "/admin/controls", label: "Controls", hint: "Platform configuration" },
  { href: "/admin/dashboard", label: "AdminHub", hint: "Charts, AI tools, extended nav" },
  { href: "/admin/immocontacts", label: "ImmoContact case files", hint: "Lead enforcement queue with legal packets" },
  { href: "/admin/content-ops", label: "Content ops case files", hint: "Broker content review with case files" },
  { href: "/admin/moderation", label: "Moderation case files", hint: "Verification queue with listing packets" },
  { href: "/admin/fsbo", label: "FSBO case files", hint: "Seller listing compliance case files" },
  { href: "/admin/referrals", label: "Referral case files", hint: "Referral revenue and reward packet queue" },
  { href: "/admin/ambassadors", label: "Ambassador case files", hint: "Commission and payout packet queue" },
];

type Props = {
  variant?: "command" | "monetization";
};

/**
 * Dense links to operational admin surfaces (view / add / edit depending on each page).
 */
export function AdminPlatformShortcuts({ variant = "command" }: Props) {
  const isSlate = variant === "monetization";
  const card = isSlate
    ? "rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left transition hover:border-slate-600 hover:bg-slate-900/80"
    : "rounded-xl border border-white/10 bg-[#0b0b0b] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.04]";
  const hintClass = isSlate ? "text-slate-500" : "text-white/50";
  const sectionTitle = isSlate ? "text-slate-400" : "text-white/50";
  const sectionHint = isSlate ? "text-slate-500" : "text-white/40";

  return (
    <section className="mt-8" aria-label="Platform management shortcuts">
      <h2 className={`text-sm font-semibold uppercase tracking-wide ${sectionTitle}`}>Manage the platform</h2>
      <p className={`mt-1 text-xs ${sectionHint}`}>
        Each link opens an admin area where you can inspect data and use that page&apos;s actions (create, edit, or
        remove where the product allows).
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SHORTCUTS.map((s) => (
          <Link key={s.href} href={s.href} prefetch={false} className={card}>
            <div className={`font-medium text-[#D4AF37]`}>{s.label} →</div>
            <div className={`mt-1 text-xs ${hintClass}`}>{s.hint}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
