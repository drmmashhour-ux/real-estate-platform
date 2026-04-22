import type { ReactNode } from "react";

import { SoinsBottomNav } from "@/components/soins/SoinsBottomNav";

export default async function SoinsFamilyDashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard/soins`;

  return (
    <>
      <div className="min-h-full">{children}</div>
      <SoinsBottomNav basePath={base} />
    </>
  );
}
