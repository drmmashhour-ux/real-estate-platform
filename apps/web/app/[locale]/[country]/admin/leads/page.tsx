import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/**
 * Admin entry for broker-style lead list (`/dashboard/leads`).
 * Unified BNHUB telemetry + scoring: `/admin/crm/internal`.
 */
export default async function AdminLeadsEntryPage() {
  const id = await getGuestId();
  if (!id) redirect("/login?next=/admin/leads");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard/leads");
  }

  redirect("/dashboard/leads");
}
