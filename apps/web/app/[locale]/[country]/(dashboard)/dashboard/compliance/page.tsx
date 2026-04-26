import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { oaciqAlignmentEnforcementEnabled } from "@/lib/compliance/oaciq/oaciq-alignment-layer.service";
import { resolveOaciqAlignmentEventAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compliance — OACIQ alignment",
  description: "Active alignment rules, violations, and resolution tracking for brokerage operations.",
};

export default async function ComplianceDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const prefix = `/${locale}/${country}`;
  const userId = await getGuestId();
  if (!userId) {
    redirect(`/auth/login?returnUrl=${encodeURIComponent(`${prefix}/dashboard/compliance`)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== PlatformRole.BROKER && user?.role !== PlatformRole.ADMIN) {
    redirect(`${prefix}/dashboard`);
  }

  const brokerScope = user.role === PlatformRole.ADMIN ? undefined : userId;

  const [rules, events, txIds] = await Promise.all([
    prisma.oaciqComplianceRule.findMany({
      where: { active: true },
      orderBy: { category: "asc" },
    }),
    prisma.oaciqComplianceAlignmentEvent.findMany({
      where: brokerScope ? { brokerId: brokerScope } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    brokerScope
      ? prisma.realEstateTransaction.findMany({
          where: { brokerId: brokerScope },
          select: { id: true },
        })
      : Promise.resolve([] as { id: string }[]),
  ]);

  const disclosureAckCount =
    txIds.length > 0
      ? await prisma.oaciqClientDisclosureAck.count({
          where: { transactionId: { in: txIds.map((t) => t.id) } },
        })
      : 0;

  const violations = events.filter((e) => e.outcome === "BLOCK" && !e.resolvedAt);
  const resolved = events.filter((e) => e.outcome === "BLOCK" && e.resolvedAt);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 text-slate-200">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">OACIQ alignment</h1>
        <p className="text-sm text-slate-400">
          Platform assistance mapped to brokerage obligations — not a regulator approval system. The broker remains
          responsible for professional decisions.
        </p>
        <p className="text-xs text-slate-500">
          System enforcement:{" "}
          <span className={oaciqAlignmentEnforcementEnabled() ? "text-emerald-400" : "text-amber-300"}>
            {oaciqAlignmentEnforcementEnabled() ? "ON (LECIPM_OACIQ_ALIGNMENT_ENFORCEMENT=1)" : "OFF"}
          </span>
        </p>
      </header>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Platform compliance summary</h2>
          <Link
            href="/api/compliance/oaciq/alignment-export"
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
          >
            Export JSON
          </Link>
        </div>
        <p className="text-sm text-slate-400">
          Download includes active rules, recent alignment events, broker decision logs count, and disclosure
          acknowledgments tied to your transactions (broker scope).
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Active rules</h2>
        <ul className="space-y-3">
          {rules.map((r) => (
            <li key={r.id} className="rounded-lg border border-white/5 bg-black/20 p-4 text-sm">
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span>{r.category}</span>
                <span>·</span>
                <span>{r.ruleKey}</span>
                <span>·</span>
                <span>{r.enforcedBySystem ? "system-enforced" : "reference"}</span>
              </div>
              <p className="mt-1 font-medium text-white">{r.title}</p>
              <p className="mt-1 text-slate-400">{r.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-200/90">Violations (blocked)</h2>
        {violations.length === 0 ? (
          <p className="text-sm text-slate-400">No unresolved blocks in this scope.</p>
        ) : (
          <ul className="space-y-4">
            {violations.map((e) => (
              <li key={e.id} className="rounded-lg border border-white/10 bg-black/30 p-4 text-sm">
                <p className="text-xs text-slate-500">
                  {e.createdAt.toISOString()} · {e.action} · listing {e.listingId ?? "—"}
                </p>
                <pre className="mt-2 overflow-x-auto text-xs text-rose-100/90">
                  {JSON.stringify(e.failedRuleKeys ?? [], null, 2)}
                </pre>
                <form action={resolveOaciqAlignmentEventAction} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="country" value={country} />
                  <input type="hidden" name="eventId" value={e.id} />
                  <input
                    name="resolutionNote"
                    placeholder="Resolution note (internal)"
                    className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="w-fit rounded bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/15"
                  >
                    Mark resolved
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resolved issues</h2>
        {resolved.length === 0 ? (
          <p className="text-sm text-slate-400">None yet.</p>
        ) : (
          <ul className="space-y-2 text-sm text-slate-400">
            {resolved.map((e) => (
              <li key={e.id} className="rounded border border-white/5 p-3">
                <span className="text-slate-500">{e.resolvedAt?.toISOString() ?? ""}</span> —{" "}
                {e.failedRuleKeys ? JSON.stringify(e.failedRuleKeys) : "—"}
                {e.resolutionNote ? <p className="mt-1 text-slate-300">{e.resolutionNote}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-500">
        <p>
          Disclosure acknowledgments on your transactions (broker-scoped):{" "}
          <span className="tabular-nums text-slate-300">{disclosureAckCount}</span>
        </p>
      </section>
    </div>
  );
}
