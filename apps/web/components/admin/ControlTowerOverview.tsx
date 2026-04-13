import Link from "next/link";
import type { AdminOverviewStats } from "@/lib/admin/get-admin-overview";
import { AdminLecipmDashboard } from "@/components/admin/AdminLecipmDashboard";
import type {
  AdminActivityItem,
  AdminBookingHealth,
  AdminDashboardStats,
  AdminListingsHealth,
  AdminAiOpsSummary,
  AdminRiskAlert,
} from "@/lib/admin/control-center";

const GOLD = "#D4AF37";

const QUICK_ACTIONS: { label: string; href: string; hint: string }[] = [
  { label: "Soft launch", hint: "Seeding, tracking, growth checklist", href: "/admin/soft-launch" },
  { label: "Signup traffic", hint: "Channels, daily signups, verification rate", href: "/admin/acquisition/traffic" },
  { label: "Moderation queue", hint: "FSBO & listings review", href: "/admin/moderation" },
  { label: "CRM live", hint: "Pipeline health", href: "/admin/crm-live" },
  { label: "Finance overview", hint: "Model & periods", href: "/admin/finance/overview" },
  { label: "Trust & safety", hint: "Escalations", href: "/admin/trust-safety" },
  { label: "BNHUB disputes", hint: "Guest / host", href: "/admin/bnhub-disputes" },
  { label: "Search admin", hint: "Cross-entity lookup", href: "/admin/search" },
  { label: "Reports", hint: "Exports & periods", href: "/admin/reports" },
  { label: "Growth dashboard", hint: "Acquisition", href: "/admin/growth-dashboard" },
  { label: "Domination hub", hint: "Listings, traffic, content loop", href: "/admin/domination" },
];

function cad(cents: number) {
  return (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export function ControlTowerOverview(props: {
  overview: AdminOverviewStats | null;
  stats: AdminDashboardStats;
  activity: AdminActivityItem[];
  listingsHealth: AdminListingsHealth;
  bookingHealth: AdminBookingHealth;
  aiOps: AdminAiOpsSummary;
  riskAlerts: AdminRiskAlert[];
}) {
  const { overview, ...dash } = props;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Control tower</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Full-platform visibility — BNHUB, LECIPM, deals, and payments in one place.
        </p>
      </div>

      {overview ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Users</p>
            <p className="mt-1 text-2xl font-bold text-white">{overview.totalUsers.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total deals</p>
            <p className="mt-1 text-2xl font-bold text-white">{overview.totalDeals.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Bookings today</p>
            <p className="mt-1 text-2xl font-bold text-white">{overview.bookingsToday}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Revenue today</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">{cad(overview.revenueTodayCents)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Active bookings</p>
            <p className="mt-1 text-2xl font-bold text-white">{overview.activeBookingsCount}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Open disputes</p>
            <p className="mt-1 text-2xl font-bold text-amber-300">{overview.openDisputesCount}</p>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
        <h2 className="text-lg font-semibold text-white">Quick actions</h2>
        <p className="mt-1 text-sm text-zinc-500">Jump to operational tools without leaving the tower.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-xl border border-zinc-800 bg-black/40 px-4 py-3 transition hover:border-zinc-600"
            >
              <p className="text-sm font-medium text-zinc-100">{a.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{a.hint}</p>
              <span className="mt-2 inline-block text-xs" style={{ color: GOLD }}>
                Open →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <AdminLecipmDashboard
        {...dash}
        headingTitle="Health & trends"
        headingSubtitle="KPI cards, live activity, risk alerts, and subsystem health."
      />
    </div>
  );
}
