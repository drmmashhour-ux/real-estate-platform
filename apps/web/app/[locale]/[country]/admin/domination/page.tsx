import Link from "next/link";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { loadDominationMetrics } from "@/lib/growth/domination-metrics";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { DominationBulkStaysClient } from "@/components/admin/domination/DominationBulkStaysClient";

export const dynamic = "force-dynamic";

function cad(cents: number) {
  return (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

export default async function AdminDominationHubPage() {
  await requireAdminControlUserId();
  const m = await loadDominationMetrics();

  return (
    <HubLayout title="Domination hub" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">LECIPM · BNHUB</p>
          <h1 className="mt-2 font-serif text-2xl text-amber-400">Domination system</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-500">
            One loop: inventory → traffic → conversion → content learning → better listings. Use the KPIs below, then
            drill into each subsystem. Retention (saved stays, recommendations, crons) reinforces repeat bookings.
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Published stays (total)</p>
            <p className="mt-1 text-2xl font-bold text-white">{m.stays.publishedTotal.toLocaleString()}</p>
            <p className="mt-1 text-xs text-zinc-500">+{m.stays.published7d} last 7d · +{m.stays.published30d} last 30d</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Draft stays (7d)</p>
            <p className="mt-1 text-2xl font-bold text-white">{m.stays.draftCreated7d.toLocaleString()}</p>
            <p className="mt-1 text-xs text-zinc-500">Pipeline &amp; onboarding</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">BNHUB views (7d)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{m.traffic.bnhubListingViews7d.toLocaleString()}</p>
            <p className="mt-1 text-xs text-zinc-500">Search event VIEW</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Signups (7d)</p>
            <p className="mt-1 text-2xl font-bold text-white">{m.traffic.signups7d.toLocaleString()}</p>
            <p className="mt-1 text-xs text-zinc-500">New users</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Paid bookings (7d)</p>
            <p className="mt-1 text-2xl font-bold text-white">{m.bookings.paid7d.toLocaleString()}</p>
            <p className="mt-1 text-xs text-zinc-500">Confirmed / completed + payment</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Payment volume (7d)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">{cad(m.bookings.revenue7dCents)}</p>
            <p className="mt-1 text-xs text-zinc-500">Completed payments (all linked bookings)</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Content pieces (7d / 30d)</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {m.content.machinePieces7d} / {m.content.machinePieces30d}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Machine-generated (listing-tied)</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Funnel events (7d)</p>
            <p className="mt-1 text-sm text-zinc-300">
              views {m.funnel7d.listing_view ?? 0} · contacts {m.funnel7d.contact_click ?? 0} · payments{" "}
              {m.funnel7d.payment_completed ?? 0}
            </p>
            <p className="mt-1 text-xs text-zinc-500">analytics_events</p>
          </div>
        </section>

        <p className="text-xs text-zinc-600">Snapshot: {m.generatedAt}</p>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Listing &amp; demand</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/admin/bnhub/growth" className="text-amber-400 hover:underline">
                  BNHUB growth
                </Link>
                <span className="text-zinc-600"> — acquisition, experiments</span>
              </li>
              <li>
                <Link href="/admin/bnhub/booking-growth" className="text-amber-400 hover:underline">
                  Booking growth
                </Link>
                <span className="text-zinc-600"> — winners, retargeting</span>
              </li>
              <li>
                <Link href="/admin/acquisition/traffic" className="text-amber-400 hover:underline">
                  Signup traffic
                </Link>
                <span className="text-zinc-600"> — sources &amp; channels</span>
              </li>
              <li>
                <Link href="/admin/growth-engine" className="text-amber-400 hover:underline">
                  Growth engine
                </Link>
                <span className="text-zinc-600"> — lead CSV import</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Content &amp; AI loop</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/admin/content-intelligence" className="text-amber-400 hover:underline">
                  Content intelligence
                </Link>
                <span className="text-zinc-600"> — performance, winners, recommendations</span>
              </li>
              <li>
                <Link href="/admin/intelligence" className="text-amber-400 hover:underline">
                  Platform intelligence
                </Link>
                <span className="text-zinc-600"> — signals &amp; decisions</span>
              </li>
              <li>
                <Link href="/admin/growth-dashboard" className="text-amber-400 hover:underline">
                  Growth dashboard
                </Link>
                <span className="text-zinc-600"> — scale KPIs &amp; playbooks</span>
              </li>
              <li>
                <Link href="/admin/growth-cta" className="text-amber-400 hover:underline">
                  Growth CTA report
                </Link>
                <span className="text-zinc-600"> — conversion surfaces</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <DominationBulkStaysClient />
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-6">
            <h2 className="text-lg font-semibold text-white">Conversion &amp; traffic detail</h2>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/admin/funnel" className="text-emerald-400 hover:underline">
                  Full funnel
                </Link>
              </li>
              <li>
                <Link href="/admin/growth-funnel-data" className="text-emerald-400 hover:underline">
                  Growth funnel data
                </Link>
              </li>
              <li>
                <Link href="/api/analytics/growth-dashboard?days=30" className="text-zinc-500 hover:text-zinc-300">
                  Raw growth JSON
                </Link>
              </li>
              <li>
                <Link href="/admin/bnhub" className="text-emerald-400 hover:underline">
                  BNHUB admin tower
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </HubLayout>
  );
}
