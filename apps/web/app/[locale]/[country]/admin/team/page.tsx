import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { requireStaffPortalSession } from "@/lib/admin/staff-portal-auth";
import { prisma } from "@repo/db";
import { getPerformanceForUsers, getTodayTarget, listOpsUserIds, utcDateKey } from "@/lib/team/team-queries";
import {
  TeamAdminTargetForm,
  TeamAdminTaskForm,
  TeamWorkspaceClient,
} from "@/components/admin/team/TeamWorkspaceClient";

export const dynamic = "force-dynamic";

export default async function AdminTeamWorkspacePage() {
  const auth = await requireStaffPortalSession();
  if (!auth.ok) {
    redirect(auth.status === 401 ? "/auth/login?returnUrl=/admin/team" : "/dashboard");
  }

  const { userId, role } = auth;
  const todayKey = utcDateKey();

  const [tasks, target, report, perf] = await Promise.all([
    prisma.teamTask.findMany({
      where: { assigneeUserId: userId },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      take: 200,
    }),
    getTodayTarget(userId, todayKey),
    prisma.teamDailyReport.findUnique({
      where: { userId_reportDay: { userId, reportDay: todayKey } },
    }),
    role === "ADMIN"
      ? getPerformanceForUsers(await listOpsUserIds(), new Date(Date.now() - 14 * 86400000))
      : getPerformanceForUsers([userId], new Date(Date.now() - 14 * 86400000)),
  ]);

  const taskGoal = target?.taskGoal ?? 5;

  return (
    <HubLayout title="Team workspace" hubKey="admin" navigation={hubNavigation.admin}>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">Operations</p>
          <h1 className="mt-2 font-serif text-2xl text-white">Team &amp; delegation</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Assigned tasks, daily targets, end-of-day reports, and performance. Admins delegate work; operators update
            status and log outcomes.
          </p>
        </div>

        {role === "ADMIN" ? (
          <div className="space-y-6">
            <TeamAdminTaskForm />
            <TeamAdminTargetForm defaultDay={todayKey} />
          </div>
        ) : null}

        <TeamWorkspaceClient
          role={role}
          todayKey={todayKey}
          initialTasks={tasks}
          initialReport={
            report
              ? {
                  completedWork: report.completedWork,
                  results: report.results,
                  issues: report.issues,
                }
              : null
          }
          taskGoal={taskGoal}
          performance={perf}
        />
      </div>
    </HubLayout>
  );
}
