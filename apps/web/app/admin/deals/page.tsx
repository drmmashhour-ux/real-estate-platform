import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";

import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";

const LINKS = [
  { label: "Mortgage deals (admin)", desc: "Pipeline & broker-attached mortgage opportunities.", href: "/admin/mortgage-deals" },
  { label: "Offers (platform)", desc: "Listing offers and negotiation oversight.", href: "/admin/offers" },
  { label: "RE transactions", desc: "Residential transaction monitor.", href: "/admin/transactions" },
  { label: "Disputes", desc: "Escalations and refunds.", href: "/admin/disputes" },
  { label: "Commissions", desc: "Rules and accruals.", href: "/admin/commissions" },
];

export default async function AdminDealsHubPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/deals");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");
  const role = await getUserRole();
  return (
    <HubLayout title="Deals" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Deals & transactions</h1>
          <p className="mt-2 text-sm text-slate-400">
            Monitor closings, mortgage-side deals, and offer workflows. Intervention tools live in disputes and
            operational controls.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-premium-gold/30 bg-premium-gold/[0.06] p-5 transition hover:border-premium-gold/50"
            >
              <p className="text-sm font-semibold text-premium-gold">{item.label}</p>
              <p className="mt-2 text-xs text-slate-500">{item.desc}</p>
              <span className="mt-3 inline-block text-xs text-slate-400">Open →</span>
            </Link>
          ))}
        </div>
      </div>
    </HubLayout>
  );
}
