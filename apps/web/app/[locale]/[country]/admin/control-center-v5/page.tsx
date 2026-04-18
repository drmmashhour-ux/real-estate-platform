import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { controlCenterFlags } from "@/config/feature-flags";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { CompanyCommandCenterV5Page } from "@/modules/control-center-v5/components/CompanyCommandCenterV5Page";

export const dynamic = "force-dynamic";

function V5Fallback() {
  return <p className="text-sm text-zinc-400">Loading…</p>;
}

export default async function CompanyCommandCenterV5RoutePage() {
  await requireAdminControlUserId();

  if (!controlCenterFlags.companyCommandCenterV5) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <header className="mt-4">
          <h1 className="text-2xl font-semibold tracking-tight">Company Command Center V5</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">
            Operational modes — read-only. Additive to{" "}
            <Link href="/admin/control-center-v4" className="text-amber-400/90 hover:text-amber-300">
              V4
            </Link>{" "}
            and prior control centers.
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            <code className="rounded bg-zinc-900 px-1">FEATURE_COMPANY_COMMAND_CENTER_V5</code>
          </p>
        </header>
        <div className="mt-8">
          <Suspense fallback={<V5Fallback />}>
            <CompanyCommandCenterV5Page />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
