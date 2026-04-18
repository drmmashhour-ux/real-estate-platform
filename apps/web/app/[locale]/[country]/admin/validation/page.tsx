import Link from "next/link";

import { PlatformValidationV1Dashboard } from "@/components/admin/PlatformValidationV1Dashboard";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPlatformValidationPage() {
  await requireAdminControlUserId();

  return (
    <LecipmControlShell>
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <Link
          href="/admin/testing"
          className="inline-flex rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          ← Tunnel / legacy validation
        </Link>
      </div>
      <PlatformValidationV1Dashboard />
    </LecipmControlShell>
  );
}
