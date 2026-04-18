import type { ReactNode } from "react";
import { BrokerResidentialShell } from "@/components/broker-residential/BrokerResidentialShell";

export default async function BrokerResidentialLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/residential`;
  return <BrokerResidentialShell basePath={basePath}>{children}</BrokerResidentialShell>;
}
