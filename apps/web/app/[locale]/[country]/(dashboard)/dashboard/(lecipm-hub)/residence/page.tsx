import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { resolveSeniorHubAccess, canAccessResidenceDashboard } from "@/lib/senior-dashboard/role";
import { ResidenceRoleHome } from "@/components/senior-living/dashboard/ResidenceRoleHome";

export const dynamic = "force-dynamic";

export default async function ResidenceDashboardPage({
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
  if (access.kind === "residence_manager") {
    redirect(`${base}/management`);
  }
  if (!canAccessResidenceDashboard(access)) {
    redirect(`${base}/senior`);
  }

  const isAdmin = user.role === PlatformRole.ADMIN;

  return <ResidenceRoleHome base={base} isAdmin={isAdmin} />;
}
