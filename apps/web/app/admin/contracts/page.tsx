import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";

import { AdminContractsClient } from "./AdminContractsClient";

export const dynamic = "force-dynamic";

export default async function AdminContractsHubPage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/admin/contracts");
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/dashboard");
  const role = await getUserRole();

  return (
    <HubLayout title="Contracts" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Link href="/admin/dashboard" className="text-sm text-[#C9A646] hover:underline">
            ← Control center
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-white">All contracts</h1>
          <p className="mt-1 text-sm text-slate-400">
            Filter by type, search by id/title. Open row for e-sign view; PDF uses participant access rules.
          </p>
        </div>
        <AdminContractsClient />
      </div>
    </HubLayout>
  );
}
