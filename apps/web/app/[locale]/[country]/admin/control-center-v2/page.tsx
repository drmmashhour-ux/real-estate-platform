import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { controlCenterFlags } from "@/config/feature-flags";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { CompanyCommandCenterV2Page } from "@/modules/control-center-v2/components/CompanyCommandCenterV2Page";

export const dynamic = "force-dynamic";

function V2ShellFallback() {
  return <p className="text-sm text-zinc-400">Loading…</p>;
}

export default async function CompanyCommandCenterV2RoutePage() {
  await requireAdminControlUserId();

  if (!controlCenterFlags.companyCommandCenterV2) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <header className="mt-4">
          <h1 className="text-2xl font-semibold tracking-tight">Company Command Center</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">
            Tabbed executive view across AI systems — read-only. Does not replace V1{" "}
            <Link href="/admin/control-center" className="text-amber-400/90 hover:text-amber-300">
              AI Control Center
            </Link>
            .
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            <code className="rounded bg-zinc-900 px-1">FEATURE_COMPANY_COMMAND_CENTER_V2</code>
          </p>
        </header>
        <div className="mt-8">
          <Suspense fallback={<V2ShellFallback />}>
            <CompanyCommandCenterV2Page />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
