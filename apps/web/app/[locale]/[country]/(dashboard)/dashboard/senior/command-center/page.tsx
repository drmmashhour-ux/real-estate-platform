import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { SeniorCommandCenterClient } from "@/components/senior-living/SeniorCommandCenterClient";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import {
  canAccessSeniorCommandCenter,
  seniorCommandAccessTier,
} from "@/lib/senior-command/access";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export default async function SeniorLivingCommandCenterPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;
  const dashBase = `/${locale}/${country}/dashboard`;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || !canAccessSeniorCommandCenter(user.role)) {
    redirect(`${dashBase}/senior`);
  }

  /** Product-ops dashboard replaces the dense trading-style command center for admins. */
  if (user.role === PlatformRole.ADMIN) {
    redirect(`${dashBase}/admin`);
  }

  const tier = seniorCommandAccessTier(user.role);
  const tierProp = tier === "admin" ? "admin" : "growth";

  return (
    <SeniorCommandCenterClient locale={locale} country={country} tier={tierProp} />
  );
}
