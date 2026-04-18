import Link from "next/link";
import { notFound } from "next/navigation";
import { platformImprovementFlags } from "@/config/feature-flags";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { PlatformImprovementPanel } from "@/components/platform/PlatformImprovementPanel";
import { buildFullPlatformImprovementBundle } from "@/modules/platform/platform-improvement-review.service";

export const dynamic = "force-dynamic";

export default async function AdminPlatformImprovementPage() {
  await requireAdminControlUserId();

  if (!platformImprovementFlags.platformImprovementReviewV1) {
    notFound();
  }

  const bundle = buildFullPlatformImprovementBundle();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/admin/overview" className="text-sm text-amber-400 hover:text-amber-300">
          ← Control tower overview
        </Link>
        <div className="mt-6">
          <PlatformImprovementPanel bundle={bundle} />
        </div>
      </div>
    </main>
  );
}
