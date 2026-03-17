import Link from "next/link";
import { prisma } from "@/lib/db";
import { PropertyIdentityConsoleClient } from "./property-identity-console-client";

export const dynamic = "force-dynamic";

export default async function AdminPropertyIdentitiesPage() {
  const [identities, pendingLinks] = await Promise.all([
    prisma.propertyIdentity.findMany({
      include: {
        riskRecords: { orderBy: { lastEvaluatedAt: "desc" }, take: 1 },
        _count: { select: { links: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.propertyIdentityLink.findMany({
      where: { linkStatus: "pending" },
      include: { propertyIdentity: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-2xl font-semibold">Property Identity Console</h1>
        <p className="mt-1 text-slate-400">
          Search by cadastre or address, view verification score, ownership, risk, and event history. Approve or reject listing links.
        </p>
        <PropertyIdentityConsoleClient
          initialIdentities={identities.map((i) => ({
            id: i.id,
            propertyUid: i.propertyUid,
            cadastreNumber: i.cadastreNumber,
            officialAddress: i.officialAddress,
            municipality: i.municipality,
            province: i.province,
            verificationScore: i.verificationScore,
            linkCount: i._count.links,
            risk: i.riskRecords[0] ? { riskLevel: i.riskRecords[0].riskLevel, riskScore: i.riskRecords[0].riskScore } : null,
            updatedAt: i.updatedAt,
          }))}
          pendingLinks={pendingLinks.map((l) => ({
            id: l.id,
            listingId: l.listingId,
            listingType: l.listingType,
            linkStatus: l.linkStatus,
            propertyIdentityId: l.propertyIdentityId,
            propertyUid: l.propertyIdentity.propertyUid,
            officialAddress: l.propertyIdentity.officialAddress,
            createdAt: l.createdAt,
          }))}
        />
      </div>
    </main>
  );
}
