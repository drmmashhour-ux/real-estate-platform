import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { BNHubDashboard } from "@/components/admin-bnhub/BNHubDashboard";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { bnhubV2Flags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

const BNHUB_LINKS: { label: string; desc: string; href: string }[] = [
  { label: "Domination hub", desc: "LECIPM + BNHUB growth loop, KPIs, bulk drafts.", href: "/admin/domination" },
  { label: "Booking growth", desc: "Winners, retargeting volume, reminders.", href: "/admin/bnhub/booking-growth" },
  { label: "Growth", desc: "Listings acquisition and experiments.", href: "/admin/bnhub/growth" },
  { label: "Pricing & rules", desc: "Dynamic pricing engine.", href: "/admin/bnhub/pricing" },
  { label: "Channel manager", desc: "Connections and sync health.", href: "/admin/bnhub/channel-manager" },
  { label: "Finance (BNHUB)", desc: "Hub-specific revenue view.", href: "/admin/bnhub/finance" },
  { label: "Trust", desc: "Reviews and safety signals.", href: "/admin/bnhub/trust" },
  { label: "Dispute prevention", desc: "Pre-escalation tooling.", href: "/admin/bnhub/dispute-prevention" },
  { label: "Marketing", desc: "Campaigns and placements.", href: "/admin/bnhub/marketing" },
  { label: "Concierge", desc: "Ops queue for guest issues.", href: "/admin/bnhub/concierge" },
  { label: "Services catalog", desc: "Add-ons and bundles.", href: "/admin/bnhub/services/catalog" },
  { label: "BNHUB disputes", desc: "Admin dispute console.", href: "/admin/bnhub-disputes" },
];

export default async function AdminBnhubTowerPage() {
  await requireAdminControlUserId();
  const riskAlerts = await getAdminRiskAlerts();
  const alerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={alerts}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">BNHUB</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Short-term inventory, bookings, and host economics — grouped shortcuts into existing admin hubs.
          </p>
        </div>
        {bnhubV2Flags.bnhubV2 && bnhubV2Flags.bnhubAdminControlV1 ? <BNHubDashboard /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BNHUB_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-zinc-800 bg-[#111] p-5 transition hover:border-zinc-600"
            >
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-2 text-xs text-zinc-500">{item.desc}</p>
              <span className="mt-3 inline-block text-xs" style={{ color: "#D4AF37" }}>
                Open →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </LecipmControlShell>
  );
}
