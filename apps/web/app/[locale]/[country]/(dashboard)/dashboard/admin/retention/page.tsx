import Link from "next/link";
import { redirect } from "next/navigation";

import { ReengagementBatchClient } from "@/components/admin/ReengagementBatchClient";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { findInactiveUsers, prepareReengagementBatch } from "@/lib/retention/engine";

export const dynamic = "force-dynamic";

export default async function AdminRetentionReengagementPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard/admin`;

  const admin = await requireAdminSession();
  if (!admin.ok) {
    redirect(base);
  }

  const [inactive, batch] = await Promise.all([
    findInactiveUsers().catch(() => [] as { id: string; email: string }[]),
    prepareReengagementBatch().catch(() => [] as Awaited<ReturnType<typeof prepareReengagementBatch>>),
  ]);

  return (
    <div className="min-h-screen space-y-10 bg-black p-6 text-white md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]/90">Order 58</p>
        <h1 className="mt-2 text-2xl font-bold">Re-engagement (email / SMS)</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Inactive users with marketing consent, rate-limited to one message per 3 days. Delivery is <strong>stub only</strong>{" "}
          (console logs) until providers are wired. Use checkboxes to send selected; default API behavior is dry run.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href={base} className="text-[#D4AF37] hover:underline">
            ← Admin home
          </Link>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Inactive users (SQL, 3+ days)</h2>
        <p className="mt-1 text-xs text-zinc-600">{inactive.length} row(s) — not all are batch-eligible (consent, pause, rate cap).</p>
        <ul className="mt-2 max-h-40 overflow-auto rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 text-xs text-zinc-400">
          {inactive.length === 0 ? <li>None</li> : inactive.map((r) => <li key={r.id}>{r.email}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Prepared batch (ready to send)</h2>
        <p className="mt-1 text-xs text-zinc-600">
          Generated copy below. Unsubscribes set marketing opt-ins false via{" "}
          <code className="font-mono text-zinc-500">POST /api/retention/unsubscribe</code>.
        </p>
        <ReengagementBatchClient initialBatch={batch} />
      </section>
    </div>
  );
}
