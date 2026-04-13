import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { AdminHostsClient } from "./admin-hosts-client";
import { getPendingHosts, getAllHosts } from "@/lib/bnhub/host";
import { getAdminHosts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

export default async function AdminHostsControlPage() {
  await requireAdminControlUserId();
  const [pendingHosts, allHosts, stats] = await Promise.all([
    getPendingHosts(),
    getAllHosts(),
    getAdminHosts(80),
  ]);

  return (
    <LecipmControlShell>
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-white">Hosts</h1>
          <p className="mt-1 text-sm text-zinc-500">Applications, supply health, and payout posture.</p>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-white">Pending applications ({pendingHosts.length})</h2>
          <div className="mt-4">
            <AdminHostsClient
              pendingHosts={pendingHosts.map((h) => ({
                id: h.id,
                userId: h.userId,
                status: h.status,
                name: h.name ?? h.user?.name ?? "—",
                email: h.email ?? h.user?.email ?? "—",
                phone: h.phone ?? "—",
                propertyType: h.propertyType ?? "—",
                location: h.location ?? "—",
                description: h.description ?? "—",
                createdAt: h.createdAt,
              }))}
              allHosts={allHosts.map((h) => ({
                id: h.id,
                userId: h.userId,
                status: h.status,
                name: h.name ?? h.user?.name ?? "—",
                email: h.email ?? h.user?.email ?? "—",
                createdAt: h.createdAt,
              }))}
            />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">Host performance snapshot</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-black/50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Host</th>
                    <th className="px-4 py-3">BnHub status</th>
                    <th className="px-4 py-3">Listings</th>
                    <th className="px-4 py-3">Confirmed stays</th>
                    <th className="px-4 py-3">Earnings (host payout)</th>
                    <th className="px-4 py-3">Payout mix</th>
                    <th className="px-4 py-3">Avg rating</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((h) => (
                    <tr key={h.userId} className="border-b border-zinc-800/80">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{h.name}</p>
                        <p className="text-xs text-zinc-500">{h.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{h.hostStatus ?? "—"}</td>
                      <td className="px-4 py-3">{h.listingsCount}</td>
                      <td className="px-4 py-3">{h.confirmedBookings}</td>
                      <td className="px-4 py-3" style={{ color: GOLD }}>
                        {(h.totalEarningsCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{h.payoutStatusLabel}</td>
                      <td className="px-4 py-3 text-xs">{h.avgRating != null ? h.avgRating.toFixed(1) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <p className="text-xs text-zinc-600">
          Stripe Connect:{" "}
          <Link href="/admin/bnhub/payments/onboarding" className="text-zinc-400 underline">
            onboarding & payouts
          </Link>
        </p>
      </div>
    </LecipmControlShell>
  );
}
