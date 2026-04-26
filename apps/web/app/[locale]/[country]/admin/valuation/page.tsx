import Link from "next/link";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { AdminValuationClient } from "./admin-valuation-client";

export const dynamic = "force-dynamic";

export default async function AdminValuationPage() {
  const [recentValuations, confidenceStats] = await Promise.all([
    prisma.propertyValuation.findMany({
      include: { propertyIdentity: { select: { id: true, propertyUid: true, officialAddress: true } } },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    prisma.propertyValuation.groupBy({
      by: ["confidenceLabel"],
      _count: true,
    }),
  ]);

  const byLabel: Record<string, number> = {};
  for (const s of confidenceStats) {
    byLabel[s.confidenceLabel] = s._count;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-2xl font-semibold">AVM – Valuation usage</h1>
        <p className="mt-1 text-slate-400">
          Confidence distribution, recent valuations, anomaly review. AVM is an estimate, not a legal appraisal.
        </p>
        <div className="mt-4 flex gap-4 text-sm">
          <span className="rounded bg-slate-800 px-2 py-1 text-slate-400">
            High: {byLabel.high ?? 0}
          </span>
          <span className="rounded bg-slate-800 px-2 py-1 text-slate-400">
            Medium: {byLabel.medium ?? 0}
          </span>
          <span className="rounded bg-slate-800 px-2 py-1 text-slate-400">
            Low: {byLabel.low ?? 0}
          </span>
        </div>
        <AdminValuationClient initialValuations={recentValuations.map((v) => ({
          id: v.id,
          property_identity_id: v.propertyIdentityId,
          property_uid: v.propertyIdentity.propertyUid,
          official_address: v.propertyIdentity.officialAddress,
          valuation_type: v.valuationType,
          estimated_value: v.estimatedValue,
          value_min: v.valueMin,
          value_max: v.valueMax,
          monthly_rent_estimate: v.monthlyRentEstimate,
          nightly_rate_estimate: v.nightlyRateEstimate,
          annual_revenue_estimate: v.annualRevenueEstimate,
          investment_score: v.investmentScore,
          confidence_score: v.confidenceScore,
          confidence_label: v.confidenceLabel,
          valuation_summary: v.valuationSummary,
          updated_at: v.updatedAt,
        }))} />
      </div>
    </main>
  );
}
