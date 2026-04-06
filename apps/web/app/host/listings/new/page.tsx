import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HostSevenStepWizard } from "@/components/host/listings-new/HostSevenStepWizard";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HostNewListingWizardPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/host/listings/new");

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 p-8 text-slate-400">Loading…</div>}>
      <HostSevenStepWizard />
    </Suspense>
  );
}
