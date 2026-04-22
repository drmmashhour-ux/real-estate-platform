import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { LecipmDashboardShell } from "@/components/layouts/dashboard-shell";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { buildLecipmShellPayload, shellUserDisplayName } from "@/lib/navigation/lecipm-shell-server";
import { canAccessAdminDashboard, resolveSeniorHubAccess } from "@/lib/senior-dashboard/role";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LecipmAdminShellLayout({
  children,
  params,
}: {
  children: ReactNode;
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
  if (!canAccessAdminDashboard(access)) {
    redirect(`${base}/senior`);
  }

  const payload = buildLecipmShellPayload(base, "ADMIN", access);
  const displayName = await shellUserDisplayName(userId);

  return (
    <LecipmDashboardShell
      base={base}
      shellRole={payload.shellRole}
      roleLabel={payload.roleLabel}
      sections={payload.sections}
      quickActions={payload.quickActions}
      roleOptions={payload.roleOptions}
      userDisplayName={displayName}
    >
      {children}
    </LecipmDashboardShell>
  );
}
