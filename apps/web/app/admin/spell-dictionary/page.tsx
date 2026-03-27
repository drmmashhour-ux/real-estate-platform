import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { SpellDictionaryAdminClient } from "./spell-dictionary-admin-client";

export default async function AdminSpellDictionaryPage() {
  const id = await getGuestId();
  if (!id) redirect("/login?next=/admin/spell-dictionary");
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/admin");
  const role = await getUserRole();

  return (
    <HubLayout title="Spell dictionary" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={role === "admin"}>
      <SpellDictionaryAdminClient />
    </HubLayout>
  );
}
