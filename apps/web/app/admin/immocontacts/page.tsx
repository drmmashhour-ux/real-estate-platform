import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { ImmoContactsAdminClient } from "./ImmoContactsAdminClient";

export default async function AdminImmoContactsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/immocontacts");

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");

  const role = await getUserRole();
  return (
    <HubLayout title="Immo contacts" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={role === "admin"}>
      <ImmoContactsAdminClient />
    </HubLayout>
  );
}
