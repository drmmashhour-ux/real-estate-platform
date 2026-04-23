import type { ReactNode } from "react";
import { PlatformRole } from "@prisma/client";
import { BrokerResidentialShell } from "@/components/broker-residential/BrokerResidentialShell";
import { getSession } from "@/lib/auth/get-session";
import { getBrokerLicenceDisplay } from "@/lib/compliance/oaciq/broker-licence-service";

export default async function BrokerResidentialLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/residential`;
  const { user } = await getSession();
  const licence =
    user?.role === PlatformRole.BROKER ? await getBrokerLicenceDisplay(user.id) : null;

  return (
    <BrokerResidentialShell basePath={basePath} licence={licence}>
      {children}
    </BrokerResidentialShell>
  );
}
