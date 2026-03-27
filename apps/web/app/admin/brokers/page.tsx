import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { IDENTITY_MANUAL_REVIEW_DISCLAIMER } from "@/modules/mortgage/services/broker-verification";
import { AdminBrokersClient } from "./AdminBrokersClient";
import { AdminMortgageBrokersClient } from "./AdminMortgageBrokersClient";

export const dynamic = "force-dynamic";

export default async function AdminBrokersPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/admin");

  const applications = await prisma.brokerApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true, role: true, brokerStatus: true } },
    },
  });

  const pendingMortgageBrokers = await prisma.mortgageBroker.findMany({
    where: {
      userId: { not: null },
      profileCompletedAt: { not: null },
      OR: [{ verificationStatus: "pending" }, { identityStatus: "pending" }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
    },
  });

  const mortgageRows = pendingMortgageBrokers.map((b) => ({
    id: b.id,
    fullName: b.fullName,
    name: b.name,
    email: b.email,
    phone: b.phone,
    company: b.company,
    licenseNumber: b.licenseNumber,
    yearsExperience: b.yearsExperience,
    specialties: b.specialties,
    profilePhotoUrl: b.profilePhotoUrl,
    idDocumentUrl: b.idDocumentUrl,
    selfiePhotoUrl: b.selfiePhotoUrl,
    insuranceProvider: b.insuranceProvider,
    insuranceValid: b.insuranceValid,
    brokerReferences: b.brokerReferences,
    verificationStatus: b.verificationStatus,
    identityStatus: b.identityStatus,
    createdAt: b.createdAt.toISOString(),
    user: b.user ? { email: b.user.email } : null,
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Broker certification</h1>
        <p className="mt-1 text-slate-400">
          Approve or reject broker applications. When approved, user becomes BROKER with brokerStatus verified.
        </p>
        <AdminBrokersClient applications={applications} />

        <section className="mt-14 border-t border-slate-800 pt-10">
          <h2 className="text-lg font-medium text-slate-200">Mortgage broker verification</h2>
          <p className="mt-1 text-sm text-slate-400">
            Profiles from <code className="text-slate-300">/broker/complete-profile</code>. Confirm license and identity
            (government ID + selfie) out of band, then use <strong className="font-medium text-slate-300">Verify manually</strong>{" "}
            for the license and <strong className="font-medium text-slate-300">Verify Identity</strong> for ID/selfie.
            Both must be approved before dashboard access.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{IDENTITY_MANUAL_REVIEW_DISCLAIMER}</p>
          <AdminMortgageBrokersClient brokers={mortgageRows} />
        </section>
      </div>
    </main>
  );
}
