import { redirect } from "next/navigation";
import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { ensureDefaultPromotionPlans } from "@/lib/bnhub/promotion-plans";
import { computeBnhubRevenueDashboard } from "@/lib/bnhub/revenue-dashboard";
import { BnHubLogoMark } from "@/components/bnhub/BnHubLogoMark";
import { BnhubRevenueDashboardClient } from "@/components/admin/bnhub/BnhubRevenueDashboardClient";

export const dynamic = "force-dynamic";

export default async function BnhubRevenueDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ days?: string }>;
}) {
  const guestId = await getGuestId();
  if (!guestId) redirect("/auth/login?next=/admin/revenue-dashboard");
  if (!(await isPlatformAdmin(guestId))) redirect("/admin");

  const sp = (await searchParams) ?? {};
  const days = Math.min(365, Math.max(1, Number(sp.days || 30)));

  await ensureDefaultPromotionPlans();
  const [snapshot, sales, orders, plans] = await Promise.all([
    computeBnhubRevenueDashboard(days),
    prisma.bnhubSalesAssistEntry.findMany({
      orderBy: [{ nextFollowUpAt: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        guest: { select: { id: true, email: true, name: true } },
        convertedBooking: { select: { id: true, status: true, confirmationCode: true } },
      },
    }),
    prisma.bnhubPromotionOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        plan: true,
        payer: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.bnhubPromotionPlan.findMany({
      where: { active: true },
      orderBy: [{ placement: "asc" }, { billingPeriod: "asc" }],
    }),
  ]);

  return (
    <HubLayout title="BNHUB revenue" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher>
      <div className="space-y-6 text-slate-100">
        <div>
          <BnHubLogoMark size="sm" className="max-w-[200px]" />
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Revenue + growth + automation</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Booking and promotion revenue, manual sales assist, promotion catalog, content ideas, and growth automations.
          </p>
          <Link href="/admin" className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Admin home
          </Link>
        </div>

        <BnhubRevenueDashboardClient
          initialSnapshot={snapshot}
          initialSales={JSON.parse(JSON.stringify(sales))}
          initialOrders={JSON.parse(JSON.stringify(orders))}
          plans={JSON.parse(JSON.stringify(plans))}
        />
      </div>
    </HubLayout>
  );
}
