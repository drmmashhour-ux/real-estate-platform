import { redirect } from "next/navigation";
import { SeniorExpansionDashboardClient } from "@/components/senior-living/SeniorExpansionDashboardClient";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import {
  canAccessSeniorCommandCenter,
  seniorCommandAccessTier,
} from "@/lib/senior-command/access";
import { prisma } from "@repo/db";
import { getCountryBySlug } from "@/config/countries";

export const dynamic = "force-dynamic";

export default async function SeniorExpansionPage({
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

  const tier = seniorCommandAccessTier(user.role);
  const tierProp = tier === "admin" ? "admin" : "growth";

  const def = getCountryBySlug(country);
  const countryFilter = def?.code ?? "CA";

  return (
    <SeniorExpansionDashboardClient
      locale={locale}
      countrySlug={country}
      countryFilter={countryFilter}
      tier={tierProp}
    />
  );
}
