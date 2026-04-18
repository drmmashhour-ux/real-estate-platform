import Link from "next/link";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { AdminValidationDashboard } from "@/components/admin/AdminValidationDashboard";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTestingPage() {
  await requireAdminControlUserId();

  return (
    <LecipmControlShell>
      <div className="mx-auto max-w-5xl flex flex-wrap gap-3 px-4 pt-6">
        <Link
          href="/admin/testing/e2e"
          className="inline-flex rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Full platform E2E simulation →
        </Link>
        <Link
          href="/admin/validation"
          className="inline-flex rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Platform validation v1 report →
        </Link>
      </div>
      <AdminValidationDashboard />
    </LecipmControlShell>
  );
}
