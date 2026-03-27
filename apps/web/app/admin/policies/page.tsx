import Link from "next/link";
import { getAllPolicyRules, getPolicyDecisionLog, ensureDefaultPolicies } from "@/lib/policy-engine";
import { PoliciesDashboardClient } from "./policies-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminPoliciesPage() {
  await ensureDefaultPolicies();
  const [rules, decisionLog] = await Promise.all([
    getAllPolicyRules(),
    getPolicyDecisionLog({ limit: 50 }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-2xl font-semibold">Policy engine</h1>
        <p className="mt-1 text-slate-400">
          Configurable business rules for eligibility, visibility, payout release, verification. All decisions are logged.
        </p>
        <PoliciesDashboardClient initialRules={rules} initialDecisionLog={decisionLog} />
      </div>
    </main>
  );
}
