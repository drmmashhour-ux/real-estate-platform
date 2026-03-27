import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";

export const dynamic = "force-dynamic";

export default async function AdminRiskMonitoringPage({
  searchParams,
}: {
  searchParams?: Promise<{ minRisk?: string }>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/risk-monitoring");
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== "ADMIN") redirect("/");

  const sp = (await searchParams) ?? {};
  const minRiskParam = sp.minRisk;
  const minRisk =
    minRiskParam !== undefined && minRiskParam !== "" ? Math.min(100, Math.max(0, Number.parseInt(minRiskParam, 10) || 0)) : 70;

  const role = await getUserRole();
  const highRiskListings = await prisma.fsboListing.findMany({
    where:
      minRisk <= 0
        ? { riskScore: { not: null } }
        : { riskScore: { gte: minRisk } },
    orderBy: { riskScore: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      listingCode: true,
      city: true,
      riskScore: true,
      trustScore: true,
    },
  });

  const alerts = await prisma.riskAlert.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      fsboListing: { select: { id: true, title: true, listingCode: true, city: true } },
      user: { select: { id: true, email: true, name: true } },
    },
  });

  return (
    <HubLayout title="AI risk monitoring" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={role === "admin"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">AI Risk Monitoring</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Flags from seller declaration keyword scans (rules engine). HIGH severity alerts are raised when sensitive
            topics are detected. This does not change listing status — review and follow up as needed.
          </p>
        </div>

        {alerts.length === 0 ? (
          <p className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-6 text-sm text-slate-400">
            No risk alerts yet. Alerts appear when a seller declaration scan finds HIGH-risk keywords.
          </p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li
                key={a.id}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  a.severity === "HIGH"
                    ? "border-red-500/40 bg-red-950/30 text-red-100/95"
                    : "border-amber-500/35 bg-amber-950/20 text-amber-50/95"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-90">
                    {a.severity === "HIGH" ? "⚠️ HIGH" : "MEDIUM"}
                  </span>
                  <time className="text-[11px] text-slate-500" dateTime={a.createdAt.toISOString()}>
                    {a.createdAt.toLocaleString()}
                  </time>
                </div>
                <p className="mt-2 leading-relaxed">{a.message}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Seller: {a.user.email ?? a.user.id}
                  {a.fsboListing.title ? ` · ${a.fsboListing.title}` : ""}
                  {a.fsboListing.listingCode ? ` · ${a.fsboListing.listingCode}` : ""}
                </p>
                <Link
                  href={`/admin/fsbo/${a.fsboListingId}/edit`}
                  className="mt-2 inline-block text-xs font-medium text-[#C9A646] hover:underline"
                >
                  Open listing (admin) →
                </Link>
                <Link
                  href={`/sell/${a.fsboListingId}`}
                  className="ml-3 inline-block text-xs text-slate-500 hover:text-slate-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Public listing
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link href="/admin/dashboard" className="text-sm text-[#C9A646] hover:underline">
          ← Admin dashboard
        </Link>
      </div>
    </HubLayout>
  );
}
