import Link from "next/link";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { VerificationsDashboardClient } from "./verifications-dashboard-client";
import { ProfessionalVerificationsClient } from "./professional-verifications-client";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const [
    pendingRaw,
    verifiedRaw,
    rejectedRaw,
    hostApplications,
    brokerApplications,
    developerApplications,
  ] = await Promise.all([
    prisma.shortTermListing.findMany({
      where: { listingVerificationStatus: "PENDING_VERIFICATION" },
      include: {
        owner: {
          include: {
            identityVerifications: true,
            brokerVerifications: true,
          },
        },
        propertyDocuments: {
          include: {
            documentExtractions: true,
          },
        },
        propertyVerification: true,
        propertyLocationValidation: true,
        verificationMatch: true,
        verificationFraudAlerts: { orderBy: { createdAt: "desc" }, take: 10 },
      },
      orderBy: { submittedForVerificationAt: "asc" },
      take: 100,
    }),
    prisma.shortTermListing.findMany({
      where: { listingVerificationStatus: "VERIFIED" },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        propertyDocuments: { take: 1 },
        propertyVerification: true,
      },
      orderBy: { verifiedAt: "desc" },
      take: 30,
    }),
    prisma.shortTermListing.findMany({
      where: { listingVerificationStatus: "REJECTED" },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        propertyVerification: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.hostApplication.findMany({
      where: { status: "pending" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.brokerApplication.findMany({
      where: { status: "pending" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.developerApplication.findMany({
      where: { status: "pending" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const normalizeListing = (l: any) => ({
    ...l,
    propertyLocationValidation: l.propertyLocationValidation ?? null,
    verificationMatch: l.verificationMatch ?? null,
    verificationFraudAlerts: Array.isArray(l.verificationFraudAlerts) ? l.verificationFraudAlerts : [],
    propertyDocuments: Array.isArray(l.propertyDocuments) ? l.propertyDocuments : [],
  });
  const pending = pendingRaw.map(normalizeListing) as any[];
  const verified = verifiedRaw.map(normalizeListing) as any[];
  const rejected = rejectedRaw.map(normalizeListing) as any[];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Property ownership
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Verification dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Review land register extracts and cadastre numbers. Approve or reject listing verification.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/admin" className="text-sm font-medium text-slate-400 hover:text-slate-300">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </section>

      <ProfessionalVerificationsClient
        hostApplications={hostApplications}
        brokerApplications={brokerApplications}
        developerApplications={developerApplications}
      />

      <VerificationsDashboardClient
        pendingListings={pending}
        verifiedListings={verified}
        rejectedListings={rejected}
      />
    </main>
  );
}
