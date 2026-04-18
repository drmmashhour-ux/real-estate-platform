import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { controlCenterFlags } from "@/config/feature-flags";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { CompanyCommandCenterV3Page } from "@/modules/control-center-v3/components/CompanyCommandCenterV3Page";

export const dynamic = "force-dynamic";

function V3ShellFallback() {
  return <p className="text-sm text-zinc-400">Loading…</p>;
}

export default async function CompanyCommandCenterV3RoutePage() {
  await requireAdminControlUserId();

  if (!controlCenterFlags.companyCommandCenterV3) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <header className="mt-4">
          <h1 className="text-2xl font-semibold tracking-tight">Company Command Center V3</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">
            Role-based read-only views — additive to{" "}
            <Link href="/admin/control-center" className="text-amber-400/90 hover:text-amber-300">
              V1
            </Link>{" "}
            and{" "}
            <Link href="/admin/control-center-v2" className="text-amber-400/90 hover:text-amber-300">
              V2
            </Link>
            .
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            <code className="rounded bg-zinc-900 px-1">FEATURE_COMPANY_COMMAND_CENTER_V3</code>
          </p>
        </header>
        <div className="mt-8">
          <Suspense fallback={<V3ShellFallback />}>
            <CompanyCommandCenterV3Page />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
