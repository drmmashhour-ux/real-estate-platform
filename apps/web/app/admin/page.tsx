import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { AdminLecipmDashboard } from "@/components/admin/AdminLecipmDashboard";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getGuestId } from "@/lib/auth/session";
import { ACCOUNTANT_NAV } from "@/lib/admin/accountant-nav";
import {
  getAdminActivityFeed,
  getAdminAiOps,
  getAdminBookingHealth,
  getAdminDashboardStats,
  getAdminListingsHealth,
  getAdminRiskAlerts,
} from "@/lib/admin/control-center";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const guestId = await getGuestId();

  if (!guestId) {
    redirect("/auth/login?returnUrl=/admin");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: guestId },
    select: { role: true },
  });

  if (dbUser?.role === "ACCOUNTANT") {
    return (
      <HubLayout title="Accounting" hubKey="admin" navigation={ACCOUNTANT_NAV} showAdminInSwitcher={false}>
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-white">Accounting workspace</h1>
            <p className="mt-2 text-sm text-slate-400">
              You can view financial data, commissions, exports, and tax documents. System configuration, user deletion,
              and platform settings require an administrator.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ACCOUNTANT_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-white/10 p-4 text-sm font-medium text-white transition hover:bg-white/5"
              >
                {item.label} →
              </Link>
            ))}
          </div>
        </div>
      </HubLayout>
    );
  }

  const admin = await requireAdminSession();
  if (!admin.ok) {
    redirect(admin.status === 401 ? "/auth/login?returnUrl=/admin" : "/dashboard");
  }

  const [stats, activity, listingsHealth, bookingHealth, aiOps, riskAlerts] = await Promise.all([
    getAdminDashboardStats(),
    getAdminActivityFeed(24),
    getAdminListingsHealth(),
    getAdminBookingHealth(),
    getAdminAiOps(),
    getAdminRiskAlerts(),
  ]);

  const alerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={alerts}>
      <AdminLecipmDashboard
        stats={stats}
        activity={activity}
        listingsHealth={listingsHealth}
        bookingHealth={bookingHealth}
        aiOps={aiOps}
        riskAlerts={riskAlerts}
      />
    </LecipmControlShell>
  );
}
