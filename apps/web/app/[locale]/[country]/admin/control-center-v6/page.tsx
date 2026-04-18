import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { controlCenterFlags } from "@/config/feature-flags";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { CompanyCommandCenterV6Page } from "@/modules/control-center-v6/components/CompanyCommandCenterV6Page";

export const dynamic = "force-dynamic";

function V6Fallback() {
  return <p className="text-sm text-zinc-400">Loading…</p>;
}

export default async function CompanyCommandCenterV6RoutePage() {
  await requireAdminControlUserId();

  if (!controlCenterFlags.companyCommandCenterV6) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <header className="mt-4">
          <h1 className="text-2xl font-semibold tracking-tight">Company Command Center V6</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">
            Executive governance — weekly board pack, diligence, launch war room, and audit trail. Read-only,
            decision-support. Additive to{" "}
            <Link href="/admin/control-center-v5" className="text-amber-400/90 hover:text-amber-300">
              V5
            </Link>
            ,{" "}
            <Link href="/admin/control-center-v4" className="text-amber-400/90 hover:text-amber-300">
              V4
            </Link>
            , and prior control centers.
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            <code className="rounded bg-zinc-900 px-1">FEATURE_COMPANY_COMMAND_CENTER_V6</code>
          </p>
        </header>
        <div className="mt-8">
          <Suspense fallback={<V6Fallback />}>
            <CompanyCommandCenterV6Page />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
