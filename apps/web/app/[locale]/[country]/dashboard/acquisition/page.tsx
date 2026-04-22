import { AcquisitionDashboardClient } from "@/components/acquisition/AcquisitionDashboardClient";
import { getAcquisitionDashboardVm } from "@/modules/acquisition/acquisition.service";

export const dynamic = "force-dynamic";

export default async function AcquisitionDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const prefix = `/${locale}/${country}`;
  const initial = await getAcquisitionDashboardVm();

  return (
    <div className="mx-auto max-w-[1680px] space-y-8 p-6 text-white">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white">First 100 Users — Acquisition</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Controlled early-stage CRM: outreach pipeline, onboarding visibility, invites, and traction metrics — not automated marketing sends.
        </p>
      </header>

      <AcquisitionDashboardClient localeCountryPrefix={prefix} initial={initial} />
    </div>
  );
}
