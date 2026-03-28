import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";

import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";

const LINKS = [
  { label: "Verification queue (BNHub)", desc: "Approve or reject short-term listings after checks.", href: "/admin/moderation" },
  { label: "Listing compliance", desc: "Regulatory / OACIQ-style compliance tooling.", href: "/admin/listing-compliance" },
  { label: "FSBO listings", desc: "For-sale-by-owner inventory and moderation.", href: "/admin/fsbo" },
  { label: "Hosts (BNHub)", desc: "Host accounts and supply.", href: "/admin/hosts" },
  { label: "BNHub issues", desc: "Guest-reported booking issues.", href: "/admin/issues" },
];

export default async function AdminListingsHubPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/listings");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");
  const role = await getUserRole();
  return (
    <HubLayout title="Listings" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Global listings</h1>
          <p className="mt-2 text-sm text-slate-400">
            Central entry point for CRM, FSBO, and short-term inventory. Use the queue for approvals; deep tools stay in
            the linked modules.
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
