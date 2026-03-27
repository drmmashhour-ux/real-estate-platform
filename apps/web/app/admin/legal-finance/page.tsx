import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { LegalFinanceAdminClient } from "./LegalFinanceAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminLegalFinancePage() {
  const guestId = await getGuestId();
  if (!guestId) redirect("/auth/login?next=/admin/legal-finance");
  const u = await prisma.user.findUnique({ where: { id: guestId }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/dashboard");

  const role = await getUserRole();
  return (
    <HubLayout title="Legal & finance" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={role === "admin"}>
      <div className="mx-auto max-w-6xl">
        <LegalFinanceAdminClient />
      </div>
    </HubLayout>
  );
}
