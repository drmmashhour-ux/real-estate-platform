import Link from "next/link";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { prisma } from "@/lib/db";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";
import { calculateChecklistProgress } from "@/modules/intake/services/calculate-checklist-progress";

export const dynamic = "force-dynamic";

type Search = {
  status?: string;
  filter?: string;
};

export default async function BrokerIntakeDashboardPage(props: {
  searchParams: Promise<Search>;
}) {
  const user = await requireBrokerOrAdminPage("/dashboard/broker/intake");
  const sp = await props.searchParams;
  const statusFilter = sp.status?.trim();
  const listFilter = sp.filter?.trim();

  const clients = await prisma.brokerClient.findMany({
    where: user.role === "ADMIN" ? {} : { brokerId: user.id },
    include: {
      intakeProfile: true,
      requiredDocumentItems: { where: { deletedAt: null } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const rows = clients
    .map((c) => {
      const progress = calculateChecklistProgress(c.requiredDocumentItems);
      const intakeStatus = c.intakeProfile?.status ?? "NOT_STARTED";
      const pendingReview = c.requiredDocumentItems.filter(
        (i) => i.status === "UPLOADED" || i.status === "UNDER_REVIEW"
      ).length;
      const overdue = c.requiredDocumentItems.filter(
        (i) => i.dueAt && i.dueAt < new Date() && i.status !== "APPROVED" && i.status !== "WAIVED"
      ).length;
      const missingMandatory = c.requiredDocumentItems.filter(
        (i) => i.isMandatory && i.status !== "APPROVED" && i.status !== "WAIVED"
      ).length;

      return {
        id: c.id,
        fullName: c.fullName,
        intakeStatus,
        progress,
        pendingReview,
        overdue,
        missingMandatory,
      };
    })
    .filter((r) => {
      if (statusFilter && r.intakeStatus !== statusFilter) return false;
      if (listFilter === "missing_mandatory" && r.missingMandatory === 0) return false;
      if (listFilter === "under_review" && r.pendingReview === 0) return false;
      if (listFilter === "completed" && r.intakeStatus !== "COMPLETE") return false;
      return true;
    });

  const card = "rounded-xl border border-white/10 bg-black/30 p-5";

  return (
    <HubLayout
      title="Client intake"
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
    >
      <div className="space-y-6 text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            Required documents and intake progress for your CRM clients.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href="/dashboard/broker/intake" className="text-emerald-400 hover:underline">
              All
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/dashboard/broker/intake?filter=missing_mandatory" className="text-slate-400 hover:underline">
              Missing mandatory
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/dashboard/broker/intake?filter=under_review" className="text-slate-400 hover:underline">
              Under review
            </Link>
            <span className="text-slate-600">|</span>
            <Link href="/dashboard/broker/intake?filter=completed" className="text-slate-400 hover:underline">
              Completed
            </Link>
          </div>
        </div>

        <section className={card}>
          <div className="flex flex-wrap gap-2 text-xs">
            {(
              [
                "NOT_STARTED",
                "IN_PROGRESS",
                "UNDER_REVIEW",
                "COMPLETE",
                "ON_HOLD",
              ] as const
            ).map((s) => (
              <Link
                key={s}
                href={
                  statusFilter === s
                    ? "/dashboard/broker/intake"
                    : `/dashboard/broker/intake?status=${encodeURIComponent(s)}`
                }
                className={
                  statusFilter === s
                    ? "rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-200"
                    : "rounded-full border border-white/10 px-2 py-1 text-slate-400 hover:bg-white/5"
                }
              >
                {s.replace(/_/g, " ")}
              </Link>
            ))}
          </div>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold text-white">Clients</h2>
          {rows.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No clients match these filters.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2"
                >
                  <div>
                    <Link
                      href={`/dashboard/broker/intake/${r.id}`}
                      className="font-medium text-white hover:text-emerald-300"
                    >
                      {r.fullName}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {r.intakeStatus.replace(/_/g, " ")} · {r.progress.percentComplete}% · {r.pendingReview}{" "}
                      pending review
                      {r.overdue > 0 ? ` · ${r.overdue} overdue` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/broker/intake/${r.id}`}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </HubLayout>
  );
}
