import Link from "next/link";
import { notFound } from "next/navigation";
import { controlCenterFlags } from "@/config/feature-flags";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { AiControlCenterPage } from "@/modules/control-center/components/AiControlCenterPage";

export const dynamic = "force-dynamic";

export default async function AiControlCenterRoutePage() {
  await requireAdminControlUserId();

  if (!controlCenterFlags.aiControlCenterV1) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <header className="mt-4">
          <h1 className="text-2xl font-semibold tracking-tight">AI Control Center</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">
            Executive view of Brain, Ads, CRO, Ranking, Operator, Platform Core, Fusion, autonomous growth, and Swarm — read-only
            governance signals. No actions execute from this page.
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            Gated by <code className="rounded bg-zinc-900 px-1">FEATURE_AI_CONTROL_CENTER_V1</code>.
          </p>
        </header>
        <div className="mt-8">
          <AiControlCenterPage />
        </div>
      </div>
    </div>
  );
}
