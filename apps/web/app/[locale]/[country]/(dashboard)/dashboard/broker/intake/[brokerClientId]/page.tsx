import Link from "next/link";
import { notFound } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@repo/db";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";
import { calculateChecklistProgress } from "@/modules/intake/services/calculate-checklist-progress";
import { buildIntakeReadinessSummary } from "@/modules/intake/services/build-intake-readiness-summary";
import { INTAKE_TEMPLATE_KEYS } from "@/modules/intake/services/intake-templates";
import { ClientIntakeTimeline } from "@/components/intake/ClientIntakeTimeline";
import { IntakeChecklistRefresh } from "@/components/intake/IntakeChecklistRefresh";
import { BrokerIntakeDetailActions } from "./broker-intake-detail-actions";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ brokerClientId: string }> };

export default async function BrokerIntakeDetailPage(props: PageProps) {
  const { brokerClientId } = await props.params;
  const user = await requireBrokerOrAdminPage(`/dashboard/broker/intake/${brokerClientId}`);

  const bc = await prisma.brokerClient.findFirst({
    where:
      user.role === "ADMIN"
        ? { id: brokerClientId }
        : { id: brokerClientId, brokerId: user.id },
    include: {
      intakeProfile: true,
      linkedUser: { select: { id: true, email: true, name: true } },
    },
  });
  if (!bc) notFound();

  let profile = bc.intakeProfile;
  if (!profile) {
    profile = await prisma.clientIntakeProfile.create({
      data: { brokerClientId, userId: bc.userId ?? undefined },
    });
  }

  const items = await prisma.requiredDocumentItem.findMany({
    where: { brokerClientId, deletedAt: null },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    include: {
      linkedDocumentFile: {
        select: { id: true, originalName: true, status: true },
      },
    },
  });

  const events = await prisma.clientIntakeEvent.findMany({
    where: { brokerClientId },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
  });

  const progress = calculateChecklistProgress(items);
  const readiness = buildIntakeReadinessSummary(profile, items);

  const checklistItems = items.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    category: i.category,
    status: i.status,
    isMandatory: i.isMandatory,
    dueAt: i.dueAt?.toISOString() ?? null,
    rejectionReason: i.rejectionReason,
    notes: i.notes,
    linkedDocumentFile: i.linkedDocumentFile,
  }));

  const timelineEvents = events.map((e) => ({
    id: e.id,
    type: e.type,
    message: e.message,
    createdAt: e.createdAt.toISOString(),
    actor: e.actor,
  }));

  const card = "rounded-xl border border-white/10 bg-black/30 p-5";

  return (
    <HubLayout
      title={`Intake · ${bc.fullName}`}
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
    >
      <div className="space-y-6 text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/dashboard/broker/intake" className="text-sm text-emerald-400/90 hover:underline">
              ← Intake dashboard
            </Link>
            <h2 className="mt-2 text-xl font-semibold text-white">{bc.fullName}</h2>
            <p className="text-sm text-slate-400">{readiness.headline}</p>
          </div>
          <BrokerIntakeDetailActions
            brokerClientId={brokerClientId}
            currentStatus={profile.status}
            templateKeys={INTAKE_TEMPLATE_KEYS}
          />
        </div>

        <section className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">Checklist progress</h3>
            <span className="text-sm text-slate-400">{progress.percentComplete}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500/80 transition-all"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">{readiness.detail}</p>
        </section>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Intake profile</h3>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Legal name</dt>
              <dd className="text-slate-200">
                {[profile.legalFirstName, profile.legalLastName].filter(Boolean).join(" ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="text-slate-200">{profile.status.replace(/_/g, " ")}</dd>
            </div>
          </dl>
        </section>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Required documents</h3>
          <div className="mt-4">
            <IntakeChecklistRefresh brokerClientId={brokerClientId} items={checklistItems} role="broker" />
          </div>
        </section>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Timeline</h3>
          <div className="mt-4">
            <ClientIntakeTimeline events={timelineEvents} />
          </div>
        </section>
      </div>
    </HubLayout>
  );
}
