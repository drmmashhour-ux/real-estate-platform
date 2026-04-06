import Link from "next/link";
import type {
  AdminActivityItem,
  AdminBookingHealth,
  AdminDashboardStats,
  AdminListingsHealth,
  AdminAiOpsSummary,
  AdminRiskAlert,
} from "@/lib/admin/control-center";

const GOLD = "#D4AF37";

function Trend({ t }: { t: "up" | "down" | "flat" }) {
  if (t === "flat") return <span className="text-zinc-600">—</span>;
  return <span className={t === "up" ? "text-emerald-400" : "text-rose-400"}>{t === "up" ? "↑" : "↓"}</span>;
}

function cad(cents: number) {
  return (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

const CARDS: {
  key: keyof AdminDashboardStats["trends"];
  label: string;
  href: string;
  format: (s: AdminDashboardStats) => string;
}[] = [
  { key: "listings", label: "Active listings", href: "/admin/listings", format: (s) => String(s.activeListings) },
  {
    key: "bookings",
    label: "Confirmed bookings",
    href: "/admin/bookings",
    format: (s) => String(s.confirmedBookings),
  },
  {
    key: "revenue",
    label: "Gross platform revenue",
    href: "/admin/payouts",
    format: (s) => cad(s.grossPlatformRevenueCents),
  },
  {
    key: "payouts",
    label: "Pending payouts",
    href: "/admin/payouts",
    format: (s) => cad(s.pendingPayoutsCents),
  },
  {
    key: "disputes",
    label: "Open disputes",
    href: "/admin/disputes",
    format: (s) => String(s.openDisputes),
  },
  {
    key: "users",
    label: "New users (month)",
    href: "/admin/users",
    format: (s) => String(s.newUsersThisMonth),
  },
];

export function AdminLecipmDashboard(props: {
  stats: AdminDashboardStats;
  activity: AdminActivityItem[];
  listingsHealth: AdminListingsHealth;
  bookingHealth: AdminBookingHealth;
  aiOps: AdminAiOpsSummary;
  riskAlerts: AdminRiskAlert[];
}) {
  const { stats, activity, listingsHealth, bookingHealth, aiOps, riskAlerts } = props;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Platform overview</h1>
        <p className="mt-1 text-sm text-zinc-500">BNHub + LECIPM — live health snapshot.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-zinc-800 bg-[#111] p-5 shadow-sm transition hover:border-zinc-700"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{c.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{c.format(stats)}</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
              vs prior period <Trend t={stats.trends[c.key]} />
            </p>
          </Link>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <h2 className="text-lg font-semibold text-white">Platform activity</h2>
          <ul className="mt-4 space-y-3">
            {activity.length === 0 ? (
              <li className="text-sm text-zinc-500">No recent events.</li>
            ) : (
              activity.slice(0, 12).map((a) => (
                <li key={a.id} className="border-b border-zinc-800/80 pb-3 last:border-0">
                  <p className="text-sm font-medium text-zinc-200">{a.label}</p>
                  <p className="text-xs text-zinc-500">{a.detail}</p>
                  <p className="text-[10px] text-zinc-600">{a.at.toISOString().slice(0, 16)}</p>
                  {a.href ? (
                    <Link href={a.href} className="mt-1 inline-block text-xs" style={{ color: GOLD }}>
                      Open →
                    </Link>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>

        <section id="admin-alerts" className="scroll-mt-24 rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <h2 className="text-lg font-semibold text-white">Risk alerts</h2>
          <ul className="mt-4 space-y-2">
            {riskAlerts.slice(0, 8).map((r) => (
              <li key={r.id}>
                <Link
                  href={r.href}
                  className={`block rounded-xl border px-3 py-2 text-sm transition hover:bg-zinc-900 ${
                    r.severity === "high"
                      ? "border-red-900/50 bg-red-950/20"
                      : r.severity === "medium"
                        ? "border-amber-900/40 bg-amber-950/10"
                        : "border-zinc-800"
                  }`}
                >
                  <span className="font-medium text-zinc-200">{r.title}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{r.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <h2 className="text-lg font-semibold text-white">Listings health</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-400">
              <dt>Draft</dt>
              <dd className="text-white">{listingsHealth.draft}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Published</dt>
              <dd className="text-white">{listingsHealth.published}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Paused</dt>
              <dd className="text-white">{listingsHealth.paused}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Flagged / review</dt>
              <dd className="text-white">{listingsHealth.flagged}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Missing photos</dt>
              <dd className="text-white">{listingsHealth.missingPhotos}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Thin descriptions</dt>
              <dd className="text-white">{listingsHealth.weakDescriptions}</dd>
            </div>
          </dl>
          <Link href="/admin/listings/stays" className="mt-4 inline-block text-sm" style={{ color: GOLD }}>
            Open listings ops →
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <h2 className="text-lg font-semibold text-white">Booking health</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-400">
              <dt>Pending / awaiting</dt>
              <dd className="text-white">{bookingHealth.pending}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Confirmed</dt>
              <dd className="text-white">{bookingHealth.confirmed}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Failed payments</dt>
              <dd className="text-white">{bookingHealth.failedPayments}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Canceled (lifetime)</dt>
              <dd className="text-white">{bookingHealth.canceled}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Refund volume</dt>
              <dd className="text-white">{cad(bookingHealth.refundVolumeCents)}</dd>
            </div>
          </dl>
          <Link href="/admin/bookings" className="mt-4 inline-block text-sm" style={{ color: GOLD }}>
            All bookings →
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <h2 className="text-lg font-semibold text-white">AI ops</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-400">
              <dt>Engine events (24h)</dt>
              <dd className="text-white">{aiOps.suggestionsToday}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Autopilot signals</dt>
              <dd className="text-white">{aiOps.autopilotActions}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Pricing queue</dt>
              <dd className="text-white">{aiOps.pricingRecommendationsPending}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Descriptions</dt>
              <dd className="text-white">{aiOps.descriptionImprovementsPending}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Completeness</dt>
              <dd className="text-white">{aiOps.listingCompletenessPending}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Active promos</dt>
              <dd className="text-white">{aiOps.promotionSuggestionsPending}</dd>
            </div>
            <div className="flex justify-between text-zinc-400">
              <dt>Failed tasks (24h)</dt>
              <dd className="text-rose-300">{aiOps.failedTasks}</dd>
            </div>
          </dl>
          <Link href="/admin/ai" className="mt-4 inline-block text-sm" style={{ color: GOLD }}>
            AI control →
          </Link>
        </div>
      </section>
    </div>
  );
}
