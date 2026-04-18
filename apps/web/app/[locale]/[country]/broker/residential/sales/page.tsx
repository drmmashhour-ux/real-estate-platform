import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { revenueV4Flags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SalesWorkbench } from "@/components/sales/SalesWorkbench";

export const dynamic = "force-dynamic";

export default async function BrokerResidentialSalesPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const basePath = `/${locale}/${country}/broker/residential`;
  const path = `${basePath}/sales`;

  const userId = await getGuestId();
  if (!userId) redirect(`/auth/login?next=${encodeURIComponent(path)}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    redirect(`/${locale}/${country}/broker/residential`);
  }

  if (!revenueV4Flags.gtmEngineV1) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-400">
        <p>Sales workbench disabled.</p>
        <Link href={basePath} className="mt-4 inline-block text-emerald-400 hover:underline">
          ← Residential hub
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-slate-50">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Sales workbench</h1>
        <p className="mt-1 text-sm text-slate-500">
          Scripts and ROI helpers — review before client-facing use; no performance guarantees.
        </p>
        <Link href={basePath} className="mt-4 inline-block text-sm text-emerald-400 hover:underline">
          ← Residential hub
        </Link>
      </div>
      <SalesWorkbench marketDefault="Montréal" />
    </div>
  );
}
