import { AdminSimulationDashboard } from "@/components/admin/AdminSimulationDashboard";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSimulationPage() {
  await requireAdminControlUserId();

  return (
    <LecipmControlShell>
      <AdminSimulationDashboard />
    </LecipmControlShell>
  );
}
