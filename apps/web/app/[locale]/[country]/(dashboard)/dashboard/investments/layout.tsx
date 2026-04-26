import { redirect } from "next/navigation";
import { ensureDynamicAuthRequest } from "@/lib/auth/ensure-dynamic-request";
import { getGuestId } from "@/lib/auth/session";
import { isInvestmentFeaturesEnabled } from "@/lib/compliance/investment-features";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Investment hub is off by default (AMF / securities risk).
 * Enable with INVESTMENT_FEATURES_ENABLED=true and/or Platform financial settings (admin).
 * Platform admins always see the hub for operations / QA.
 */
export default async function InvestmentsLayout({ children }: { children: React.ReactNode }) {
  await ensureDynamicAuthRequest();
  if (await isInvestmentFeaturesEnabled()) {
    return <>{children}</>;
  }

  const id = await getGuestId();
  if (id) {
    const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (u?.role === "ADMIN") {
      return <>{children}</>;
    }
  }

  redirect("/dashboard/real-estate");
}
