import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";

import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * All `/dashboard/admin/*` routes require platform admin.
 * LECIPM operations use `admin/(lecipm)/*`; launch & sales live under `admin/(legacy)/*`.
 */
export default async function AdminSectionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; country: string }>;
}) {
  await ensureDynamicAuthRequest();
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard`;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== PlatformRole.ADMIN) {
    redirect(base);
  }

  return <>{children}</>;
}
