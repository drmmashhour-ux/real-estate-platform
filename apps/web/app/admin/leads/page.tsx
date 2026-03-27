import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * Admin entry for the same CRM as brokers (full lead list via /api/leads for ADMIN).
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
