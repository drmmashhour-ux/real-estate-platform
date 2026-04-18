import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { RevenueControlPanel } from "@/components/admin/RevenueControlPanel";
import { requireAdminControlUserId } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function AdminRevenueControlPage() {
  await requireAdminControlUserId();

  return (
    <LecipmControlShell alerts={[]}>
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue control</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Pricing bands and platform fee override — does not alter Stripe core or booking state machines; unlocks are
            applied only after webhook confirmation.
          </p>
        </div>
        <RevenueControlPanel />
      </div>
    </LecipmControlShell>
  );
}
