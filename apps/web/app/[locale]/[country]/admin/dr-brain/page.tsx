import { DrBrainHealthPanel } from "@/components/admin/DrBrainHealthPanel";
import { runWebDrBrainReport } from "@/lib/drbrain";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDrBrainPage() {
  await requireAdminControlUserId();
  const report = await runWebDrBrainReport();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <DrBrainHealthPanel title="DR.BRAIN · LECIPM (apps/web)" report={report} />
    </div>
  );
}
