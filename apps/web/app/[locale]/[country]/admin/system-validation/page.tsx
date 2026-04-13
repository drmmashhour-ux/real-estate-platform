import Link from "next/link";
import { TestDashboard } from "@/components/admin/system-validation/TestDashboard";

export const dynamic = "force-dynamic";

export default function AdminSystemValidationPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin/dashboard" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">LECIPM system validation</h1>
        <p className="mt-1 max-w-3xl text-slate-400">
          End-to-end integration runner across auth, listings, simulator, watchlist, AI selection, legal graph, negotiation,
          case command center, growth records, billing gates, CRM, and load probe. Admin only; never enable{" "}
          <code className="text-amber-200/90">TEST_MODE</code> on production traffic.
        </p>
        <div className="mt-8">
          <TestDashboard />
        </div>
      </div>
    </main>
  );
}
