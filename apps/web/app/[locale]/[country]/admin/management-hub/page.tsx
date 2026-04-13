import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { ManagementHubMoneyPanel } from "@/components/admin/ManagementHubMoneyPanel";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { getManagementHubMoneySnapshot } from "@/lib/admin/management-hub-money";
import type { ManagementHubMoneySnapshot } from "@/lib/admin/management-hub-money";

export const dynamic = "force-dynamic";

const MONITOR_LINKS = [
  { href: "/admin/dashboard", label: "Control center", desc: "KPIs, AI ops, listings & booking health." },
  { href: "/admin/ceo", label: "CEO dashboard", desc: "Revenue today, growth, executive snapshot." },
  { href: "/admin/monitoring", label: "Monitoring", desc: "System and product signals." },
  { href: "/admin/revenue", label: "Revenue intelligence", desc: "Ledger, opportunities, top payers." },
  { href: "/admin/revenue-overview", label: "Revenue overview (30d)", desc: "PlatformPayment gross + fees by type." },
  { href: "/admin/revenue-dashboard", label: "BNHUB revenue", desc: "Stays, promotions, growth automation." },
  { href: "/admin/finance/overview", label: "Finance overview", desc: "Balances, payouts, transactions." },
  { href: "/admin/mortgage-analytics", label: "Mortgage analytics", desc: "Expert funnel and marketplace." },
  { href: "/admin/global-platform", label: "Global platform", desc: "Countries, demand, partner revenue." },
] as const;

const REPORT_LINKS = [
  { href: "/admin/reports/daily", label: "Daily report" },
  { href: "/admin/reports/weekly", label: "Weekly report" },
  { href: "/admin/reports/monthly", label: "Monthly report" },
  { href: "/admin/finance/reports", label: "Exports (CSV / PDF)" },
] as const;

const LAW_LINKS = [
  {
    href: "/admin/legal-ai",
    label: "Law helper (AI + drafting)",
    desc: "Risk monitor, legal-context logs, template drafting assistant — not legal advice.",
  },
  {
    href: "/admin/contracts-builder",
    label: "Contract templates (drafting book)",
    desc: "Structured marketplace agreements; edit sections and required fields.",
  },
  {
    href: "/admin/forms",
    label: "Forms & submissions",
    desc: "Review submissions and refill workflows with context from templates.",
  },
  { href: "/admin/legal", label: "Legal register", desc: "Policies and compliance references." },
  { href: "/admin/legal-finance", label: "Legal & finance", desc: "Cross-cutting finance and legal workspace." },
] as const;

function emptySnapshot(): ManagementHubMoneySnapshot {
  const z = { leadsCents: 0, bookingsCents: 0, featuredCents: 0, otherCents: 0, totalCents: 0 };
  const now = new Date().toISOString();
  return {
    generatedAt: now,
    windows: [
      { key: "day", label: "Daily (today, UTC)", reportHint: "", streams: z, byEntityTypeCents: {}, entityTypeTotalCents: 0 },
      { key: "week", label: "Weekly (this ISO week, Mon UTC → now)", reportHint: "", streams: z, byEntityTypeCents: {}, entityTypeTotalCents: 0 },
      { key: "month", label: "Monthly (this calendar month, UTC)", reportHint: "", streams: z, byEntityTypeCents: {}, entityTypeTotalCents: 0 },
    ],
  };
}

export default async function AdminManagementHubPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/management-hub");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN" && me?.role !== "ACCOUNTANT") redirect("/");

  const role = await getUserRole();

  let snapshot: ManagementHubMoneySnapshot = emptySnapshot();
  try {
    snapshot = await getManagementHubMoneySnapshot();
  } catch {
    /* DB or migration — show empty charts */
  }

  return (
    <HubLayout title="Management Hub" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-12 text-slate-100">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold/90">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Management Hub</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
            One place to monitor dashboards across the platform, read money movement by product line (daily / weekly /
            monthly windows), open structured financial reports, and use the law book plus drafting tools with AI support
            for forms and templates.
          </p>
          <Link href="/admin/dashboard" className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Control center
          </Link>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-lg font-semibold text-white">Monitor dashboards</h2>
          <p className="mt-2 text-sm text-slate-500">
            Jump into operational and executive surfaces — each link opens an existing admin area.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {MONITOR_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-premium-gold/35 hover:bg-white/[0.04]"
                >
                  <span className="font-medium text-premium-gold">{item.label}</span>
                  <span className="mt-2 block text-xs text-slate-500">{item.desc}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-premium-gold/25 bg-[radial-gradient(circle_at_top,#2d2208,transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Money dashboard</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Compare which lines drive cash: leads &amp; contacts (Immobilier), bookings &amp; platform fees (BNHUB),
                featured listings, and other checkout — plus ledger totals from{" "}
                <code className="text-slate-500">platform_revenue_events</code> by source.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {REPORT_LINKS.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-premium-gold/40"
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-8">
            <ManagementHubMoneyPanel snapshot={snapshot} />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h2 className="text-lg font-semibold text-white">Law book &amp; drafting (AI-assisted)</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Use the legal AI monitor and template-first drafting to refill structured forms and contract sections. Always
            have counsel review before reliance — the tools are assistants, not substitutes for professional advice.
          </p>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {LAW_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-2xl border border-white/10 bg-black/25 p-5 transition hover:border-sky-500/30"
                >
                  <span className="font-semibold text-sky-300/95">{item.label}</span>
                  <span className="mt-2 block text-sm text-slate-500">{item.desc}</span>
                  <span className="mt-3 inline-block text-xs text-slate-600">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </HubLayout>
  );
}
