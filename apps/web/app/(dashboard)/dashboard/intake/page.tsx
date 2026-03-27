import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { calculateChecklistProgress } from "@/modules/intake/services/calculate-checklist-progress";
import { buildIntakeReadinessSummary } from "@/modules/intake/services/build-intake-readiness-summary";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { ClientIntakeTimeline } from "@/components/intake/ClientIntakeTimeline";
import { IntakeChecklistRefresh } from "@/components/intake/IntakeChecklistRefresh";
import { ClientIntakeProfileForm } from "./client-intake-profile-form";

export const dynamic = "force-dynamic";

export default async function ClientIntakePage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) {
    return null;
  }

  void trackDemoEvent(DemoEvents.INTAKE_PAGE_VIEWED, { role: user.role }, user.id);

  const bc = await prisma.brokerClient.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      broker: { select: { name: true, email: true } },
      intakeProfile: true,
      requiredDocumentItems: {
        where: { deletedAt: null },
        orderBy: [{ category: "asc" }, { createdAt: "asc" }],
        include: {
          linkedDocumentFile: {
            select: { id: true, originalName: true, status: true },
          },
        },
      },
    },
  });

  const demoStaging = process.env.NEXT_PUBLIC_ENV === "staging";

  if (!bc) {
    return (
      <HubLayout
        title="Your intake"
        hubKey="realEstate"
        navigation={hubNavigation.realEstate}
        showAdminInSwitcher={false}
      >
        <div className="rounded-xl border border-white/10 bg-black/30 p-8 text-slate-200">
          <p className="text-lg font-medium text-white">No broker workspace linked</p>
          <p className="mt-2 text-sm text-slate-400">
            When your broker connects your account to their CRM, your intake checklist will appear here.
          </p>
        </div>
      </HubLayout>
    );
  }

  let profile = bc.intakeProfile;
  if (!profile) {
    profile = await prisma.clientIntakeProfile.create({
      data: { brokerClientId: bc.id, userId },
    });
  }

  const items = bc.requiredDocumentItems;
  const progress = calculateChecklistProgress(items);
  const readiness = buildIntakeReadinessSummary(profile, items);

  const events = await prisma.clientIntakeEvent.findMany({
    where: { brokerClientId: bc.id },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
  });

  const checklistItems = items.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    category: i.category,
    status: i.status,
    isMandatory: i.isMandatory,
    dueAt: i.dueAt?.toISOString() ?? null,
    rejectionReason: i.rejectionReason,
    notes: null,
    linkedDocumentFile: i.linkedDocumentFile,
  }));

  const timelineEvents = events.map((e) => ({
    id: e.id,
    type: e.type,
    message: e.message,
    createdAt: e.createdAt.toISOString(),
    actor: e.actor,
  }));

  const mandatoryDone = progress.approvedMandatoryCount + progress.waivedMandatoryCount;
  const card = "rounded-xl border border-white/10 bg-black/30 p-6";

  return (
    <HubLayout
      title="Client intake"
      hubKey="realEstate"
      navigation={hubNavigation.realEstate}
      showAdminInSwitcher={user.role === "ADMIN"}
    >
      <div className="space-y-6 text-slate-100">
        {demoStaging ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
            This is a demo onboarding workflow. Uploaded information and files are for testing only.
          </p>
        ) : null}

        <section className={card}>
          <h2 className="text-lg font-semibold text-white">Welcome</h2>
          <p className="mt-2 text-sm text-slate-300">
            Please complete the requested information and upload the required documents to continue. Some documents are
            mandatory before moving forward. Your broker may review and request corrections before your file is marked
            complete.
          </p>
          {bc.broker ? (
            <p className="mt-3 text-xs text-slate-500">
              Broker: {bc.broker.name ?? bc.broker.email ?? "Your broker"}
            </p>
          ) : null}
        </section>

        <section className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">Progress</h3>
            <span className="text-xs text-slate-400">{readiness.headline}</span>
          </div>
          <p className="mt-1 text-sm text-slate-400">{readiness.detail}</p>
          <p className="mt-3 text-sm text-slate-200">
            {mandatoryDone} of {progress.requiredMandatoryCount || "—"} required documents completed
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500/80 transition-all"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Intake status: <span className="text-slate-300">{profile.status.replace(/_/g, " ")}</span>
          </p>
        </section>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Your information</h3>
          <p className="mt-1 text-xs text-slate-500">Update the fields your broker needs for your file.</p>
          <div className="mt-4">
            <ClientIntakeProfileForm brokerClientId={bc.id} initial={profile} />
          </div>
        </section>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Required documents</h3>
          <div className="mt-4">
            <IntakeChecklistRefresh brokerClientId={bc.id} items={checklistItems} role="client" />
          </div>
        </section>

        <section className={card}>
          <h3 className="text-sm font-semibold text-white">Activity</h3>
          <div className="mt-4">
            <ClientIntakeTimeline events={timelineEvents} />
          </div>
        </section>
      </div>
    </HubLayout>
  );
}
