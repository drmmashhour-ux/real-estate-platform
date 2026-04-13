import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { ACCOUNTANT_NAV } from "@/lib/admin/accountant-nav";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { isOpsTeamRole } from "@/lib/admin/staff-portal-auth";

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

  if (dbUser && isOpsTeamRole(dbUser.role)) {
    redirect("/admin/team");
  }

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

  redirect("/admin/overview");
}
