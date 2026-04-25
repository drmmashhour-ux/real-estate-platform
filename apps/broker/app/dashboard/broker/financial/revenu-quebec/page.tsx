import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { getSession } from "@/lib/auth/get-session";
import { prisma } from "@/lib/db";
import { sanitizeRevenuQuebecProfileForBrokerUI } from "@/lib/financial/revenu-quebec-profile";
import { listTaxRecords } from "@/lib/financial/tax-records";
import { BrokerRevenuQuebecClient } from "./BrokerRevenuQuebecClient";

export default async function BrokerRevenuQuebecPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    redirect("/dashboard/broker");
  }

  const [profileRaw, taxes] = await Promise.all([
    prisma.revenuQuebecProfile.findUnique({
      where: {
        ownerType_ownerId: { ownerType: "solo_broker", ownerId: user.id },
      },
    }),
    listTaxRecords("solo_broker", user.id),
  ]);

  const sanitized = sanitizeRevenuQuebecProfileForBrokerUI(profileRaw);
  const initialProfile =
    sanitized ?
      {
        ...sanitized,
        firstReturnDueAt: sanitized.firstReturnDueAt
          ? new Date(sanitized.firstReturnDueAt).toISOString()
          : null,
      }
    : null;
  const initialTaxes = taxes.map((t) => ({
    id: t.id,
    taxableBaseCents: t.taxableBaseCents,
    gstCents: t.gstCents,
    qstCents: t.qstCents,
    totalWithTaxCents: t.totalWithTaxCents,
    reportingPeriodKey: t.reportingPeriodKey,
    reported: t.reported,
  }));

  return (
    <BrokerRevenuQuebecClient
      ownerType="solo_broker"
      ownerId={user.id}
      initialProfile={initialProfile}
      initialTaxes={initialTaxes}
    />
  );
}
