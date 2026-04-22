import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@/lib/db";
import { resolveSeniorHubAccess, canAccessAdminDashboard } from "@/lib/senior-dashboard/role";
import { AdminOpsHome } from "@/components/senior-living/dashboard/AdminOpsHome";
import { getAdminDashboardSummaryData } from "@/modules/dashboard/services/admin-dashboard.service";
import { AdminSuperDashboardClient } from "@/components/admin-intelligence";
import { getAdminSuperDashboardPayload } from "@/modules/admin-intelligence";

export const dynamic = "force-dynamic";

export default async function SeniorPlatformAdminDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; country: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard`;

  const sp = (await searchParams) ?? {};
  const classicRaw = sp.classic;
  const classic =
    typeof classicRaw === "string" ? classicRaw : Array.isArray(classicRaw) ? classicRaw[0] : undefined;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) redirect(base);

  const access = await resolveSeniorHubAccess(userId, user.role);
  if (!canAccessAdminDashboard(access)) {
    redirect(`${base}/senior`);
  }

  const adminBase = `/${locale}/${country}/dashboard/admin`;

  if (classic !== "1") {
    const shell = await getAdminDashboardSummaryData();
    const intel = await getAdminSuperDashboardPayload();
    return (
      <>
        <AdminHubLuxuryShell locale={locale} country={country} summary={shell} />
        <AdminSuperDashboardClient adminBase={adminBase} payload={intel} />
      </>
    );
  }

  return <AdminOpsHome base={base} />;
}
