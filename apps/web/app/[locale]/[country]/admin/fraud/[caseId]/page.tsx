import Link from "next/link";
import { notFound } from "next/navigation";
import type { FraudEntityType } from "@prisma/client";
import { FraudCaseToolbar } from "@/components/admin/FraudCaseToolbar";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminFraudCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  await requireAdminControlUserId();
  const { caseId } = await params;

  const [riskAlerts, c] = await Promise.all([
    getAdminRiskAlerts(),
    prisma.fraudCase.findUnique({
      where: { id: caseId },
      include: { decisions: { orderBy: { createdAt: "desc" }, take: 30 } },
    }),
  ]);

  if (!c) notFound();

  const [signals, policy, entityHint] = await Promise.all([
    prisma.fraudSignalEvent.findMany({
      where: { entityType: c.entityType, entityId: c.entityId },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.fraudPolicyScore.findUnique({
      where: { entityType_entityId: { entityType: c.entityType, entityId: c.entityId } },
    }),
    loadEntityHint(c.entityType, c.entityId),
  ]);

  const shellAlerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={shellAlerts}>
      <div className="space-y-8">
        <div>
          <Link href="/admin/fraud" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Fraud dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">{c.title}</h1>
          <p className="mt-2 text-sm text-zinc-400">{c.summary}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Case <span className="font-mono text-zinc-400">{c.id}</span> · {c.entityType} ·{" "}
            <span className="font-mono">{c.entityId}</span> · {c.status} · {c.riskLevel}
          </p>
        </div>

        {entityHint ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-300">
            <p className="font-medium text-white">Entity</p>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs text-zinc-400">
              {JSON.stringify(entityHint, null, 2)}
            </pre>
          </div>
        ) : null}

        {policy ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-sm font-medium text-white">Policy score</p>
            <p className="mt-2 text-xs text-zinc-400">
              Score {policy.score} · {policy.riskLevel} · recommended {policy.recommendedAction}
            </p>
            <pre className="mt-2 max-h-40 overflow-auto font-mono text-xs text-zinc-500">
              {JSON.stringify(policy.reasonsJson, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No aggregated policy score row yet.</p>
        )}

        <FraudCaseToolbar caseId={c.id} />

        <div>
          <h2 className="text-lg font-semibold text-white">Signals</h2>
          <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Signal</th>
                  <th className="px-3 py-2">Pts</th>
                  <th className="px-3 py-2">Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {signals.map((s) => (
                  <tr key={s.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-500">{s.createdAt.toISOString()}</td>
                    <td className="px-3 py-2 font-mono text-emerald-400/90">{s.signalType}</td>
                    <td className="px-3 py-2">{s.riskPoints}</td>
                    <td className="max-w-xs truncate px-3 py-2 font-mono text-zinc-500">
                      {JSON.stringify(s.metadataJson)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {signals.length === 0 ? <p className="p-4 text-center text-zinc-500">No signals.</p> : null}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Decisions</h2>
          <ul className="mt-2 space-y-2 text-sm text-zinc-400">
            {c.decisions.map((d) => (
              <li key={d.id} className="rounded-lg border border-zinc-800 px-3 py-2">
                <span className="font-mono text-xs text-zinc-500">{d.createdAt.toISOString()}</span> · {d.actionType}
                {d.notes ? <p className="mt-1 text-zinc-500">{d.notes}</p> : null}
              </li>
            ))}
            {c.decisions.length === 0 ? <li className="text-zinc-500">No decisions yet.</li> : null}
          </ul>
        </div>
      </div>
    </LecipmControlShell>
  );
}

async function loadEntityHint(entityType: FraudEntityType, entityId: string): Promise<unknown | null> {
  try {
    if (entityType === "user") {
      if (entityId.startsWith("ip:")) return { kind: "ip_bucket", entityId };
      const u = await prisma.user.findUnique({
        where: { id: entityId },
        select: { email: true, accountStatus: true, createdAt: true, role: true },
      });
      return u;
    }
    if (entityType === "listing") {
      const l = await prisma.shortTermListing.findUnique({
        where: { id: entityId },
        select: { title: true, city: true, listingStatus: true, ownerId: true, nightPriceCents: true },
      });
      return l;
    }
    if (entityType === "booking") {
      const b = await prisma.booking.findUnique({
        where: { id: entityId },
        select: {
          status: true,
          guestId: true,
          listingId: true,
          totalCents: true,
          createdAt: true,
        },
      });
      return b;
    }
    if (entityType === "payment") {
      return { stripePaymentIntentOrId: entityId };
    }
    return { entityType, entityId };
  } catch {
    return null;
  }
}
