import { Suspense } from "react";
import { prisma } from "@repo/db";
import { requireBrokerProfilePage } from "@/modules/mortgage/services/require-broker-onboarding";
import { CompleteProfileClient } from "./complete-profile-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Complete broker profile",
};

export default async function BrokerCompleteProfilePage() {
  const { userId } = await requireBrokerProfilePage();
  const broker = await prisma.mortgageBroker.findUnique({
    where: { userId },
    select: {
      fullName: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      licenseNumber: true,
      yearsExperience: true,
      specialties: true,
      insuranceProvider: true,
      brokerReferences: true,
      idDocumentUrl: true,
      selfiePhotoUrl: true,
    },
  });

  const initial = {
    fullName: broker?.fullName ?? broker?.name ?? "",
    email: broker?.email ?? "",
    phone: broker?.phone ?? "",
    company: broker?.company ?? "",
    licenseNumber: broker?.licenseNumber ?? "",
    yearsExperience: broker?.yearsExperience != null ? String(broker.yearsExperience) : "",
    specialties: broker?.specialties ?? "",
    insuranceProvider: broker?.insuranceProvider ?? "",
    references: broker?.brokerReferences ?? "",
    idDocumentUrl: broker?.idDocumentUrl ?? "",
    selfiePhotoUrl: broker?.selfiePhotoUrl ?? "",
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-50">
      <div className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-2xl font-bold text-white">Complete your profile</h1>
        <p className="mt-2 text-sm text-slate-400">
          We need professional details, your license, and identity documents (government ID + selfie) before routing
          mortgage leads. Submissions are reviewed by admin.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-white/[0.04]" aria-hidden />}>
            <CompleteProfileClient initial={initial} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
