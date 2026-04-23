import { redirect } from "next/navigation";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { HubLayout } from "@/components/hub/HubLayout";

import { prisma } from "@repo/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { ImmoContactsAdminClient } from "./ImmoContactsAdminClient";

export default async function AdminImmoContactsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/immocontacts");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");

  const role = await getUserRole();
  return (
    <HubLayout title="Immo contacts" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <ImmoContactsAdminClient />
    </HubLayout>
  );
}
