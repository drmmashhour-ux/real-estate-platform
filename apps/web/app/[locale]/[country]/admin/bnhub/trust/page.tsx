import Link from "next/link";
import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { hubNavigation } from "@/lib/hub/navigation";
import { BnhubFraudFlagStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FraudRiskBadge } from "@/components/bnhub/quality/BnhubQualityKit";

export const dynamic = "force-dynamic";

const trustNav = [
  { href: "/admin/bnhub/trust/identity", label: "Identity" },
  { href: "/admin/bnhub/trust/address", label: "Addresses" },
  { href: "/admin/bnhub/trust/media", label: "Media" },
  { href: "/admin/bnhub/trust/risk-flags", label: "Risk flags (v2)" },
  { href: "/admin/bnhub/trust/restricted-zones", label: "Restricted zones" },
];

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) redirect("/admin");

  const [flags, engineFlags] = await Promise.all([
    prisma.bnhubFraudFlag.findMany({
      where: { status: { in: [BnhubFraudFlagStatus.OPEN, BnhubFraudFlagStatus.UNDER_REVIEW] } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { id: true, listingId: true, flagType: true, severity: true, summary: true, createdAt: true },
    }),
    prisma.bnhubTrustRiskFlag.findMany({
      where: { flagStatus: { in: [BnhubFraudFlagStatus.OPEN, BnhubFraudFlagStatus.UNDER_REVIEW] } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { id: true, listingId: true, flagType: true, severity: true, summary: true, createdAt: true },
    }),
  ]);

  return (
    <HubLayout title="BNHUB trust" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="space-y-6 text-white">
        <Link href="/admin/bnhub/growth" className="text-sm text-amber-400">
          ← BNHUB growth
        </Link>
        <h1 className="text-xl font-bold">Trust & validation</h1>
        <p className="text-sm text-zinc-500">
          Internal review only — evidence stays admin-side. Guests and hosts see neutral status copy only.
        </p>
        <nav className="flex flex-wrap gap-2 text-sm">
          {trustNav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-amber-200 hover:bg-zinc-900"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <section>
          <h2 className="text-sm font-semibold text-zinc-400">Legacy fraud flags</h2>
          <ul className="mt-2 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {flags.length === 0 ? (
              <li className="p-4 text-sm text-zinc-500">No open flags.</li>
            ) : (
              flags.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                  <div>
                    <FraudRiskBadge level={f.severity} />
                    <span className="ml-2 text-zinc-300">{String(f.flagType).replace(/_/g, " ")}</span>
                    {f.listingId ? (
                      <Link className="ml-2 text-amber-400" href={`/admin/bnhub/trust/listings/${f.listingId}`}>
                        Listing
                      </Link>
                    ) : null}
                    <p className="mt-1 text-xs text-zinc-500">{f.summary}</p>
                  </div>
                  <span className="text-xs text-zinc-600">{f.createdAt.toISOString().slice(0, 10)}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-zinc-400">Trust engine flags (bnhub_risk_flags)</h2>
          <ul className="mt-2 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {engineFlags.length === 0 ? (
              <li className="p-4 text-sm text-zinc-500">No open engine flags.</li>
            ) : (
              engineFlags.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                  <div>
                    <FraudRiskBadge level={f.severity} />
                    <span className="ml-2 text-zinc-300">{String(f.flagType).replace(/_/g, " ")}</span>
                    {f.listingId ? (
                      <Link className="ml-2 text-amber-400" href={`/admin/bnhub/trust/listings/${f.listingId}`}>
                        Listing
                      </Link>
                    ) : null}
                    <p className="mt-1 text-xs text-zinc-500">{f.summary}</p>
                  </div>
                  <span className="text-xs text-zinc-600">{f.createdAt.toISOString().slice(0, 10)}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </HubLayout>
  );
}
