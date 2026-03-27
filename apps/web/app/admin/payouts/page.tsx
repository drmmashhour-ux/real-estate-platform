import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { PayoutsAdminClient } from "./PayoutsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/admin/payouts");
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/dashboard");
  const role = await getUserRole();

  return (
    <HubLayout title="Host payouts" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={role === "admin"}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Link href="/admin/dashboard" className="text-sm text-[#C9A646] hover:underline">
            ← Control center
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-white">BNHub host payouts</h1>
          <p className="mt-1 text-sm text-slate-400">
            Pending = completed guest payment, host transfer not marked released. Actions update ledger fields only — Stripe
            transfers may still follow your Connect settings.
          </p>
        </div>
        <PayoutsAdminClient />
      </div>
    </HubLayout>
  );
}
