import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";

export const dynamic = "force-dynamic";

export default async function AdminBnhubDisputesPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?returnUrl=/admin/bnhub-disputes");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/dashboard");
  const role = await getUserRole();

  const disputes = await prisma.dispute.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      status: true,
      claimant: true,
      description: true,
      createdAt: true,
      aiAssistantRecommendation: true,
      listing: { select: { title: true, city: true } },
      booking: {
        select: {
          checkIn: true,
          checkOut: true,
          guest: { select: { name: true, email: true } },
        },
      },
    },
  });

  return (
    <HubLayout title="BNHUB disputes" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">BNHUB booking disputes</h1>
          <p className="mt-2 text-sm text-slate-400">
            Guest and host escalations. Open a case for messages, checklist, and AI assistant suggestions (non-binding).
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-premium-gold/20">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-premium-gold/20 bg-black/40 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Claimant</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">AI</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                    {d.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{d.listing.title}</td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-slate-400">
                    {d.booking.guest.name ?? d.booking.guest.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">{d.claimant}</td>
                  <td className="px-4 py-3">{d.status}</td>
                  <td className="px-4 py-3 text-premium-gold">{d.aiAssistantRecommendation ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/bnhub-disputes/${d.id}`} className="text-premium-gold hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {disputes.length === 0 ? <p className="p-6 text-sm text-slate-500">No disputes yet.</p> : null}
        </div>
      </div>
    </HubLayout>
  );
}
