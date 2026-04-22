import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@/lib/db";
import { resolveSeniorHubAccess, canAccessManagementDashboard } from "@/lib/senior-dashboard/role";
import { ManagementRoleHome } from "@/components/senior-living/dashboard/ManagementRoleHome";

export const dynamic = "force-dynamic";

export default async function ManagementDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard`;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) redirect(base);

  const access = await resolveSeniorHubAccess(userId, user.role);

  if (access.kind === "none") {
    redirect(`${base}/senior`);
  }
  if (access.kind === "residence_operator") {
    redirect(`${base}/residence`);
  }
  if (!canAccessManagementDashboard(access)) {
    redirect(`${base}/senior`);
  }

  return <ManagementRoleHome base={base} />;
}
