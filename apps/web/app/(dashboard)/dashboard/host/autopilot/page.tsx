import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getHostAutopilotConfig } from "@/lib/ai/autopilot/host-config";
import { HostAutopilotClient } from "./host-autopilot-client";

export const dynamic = "force-dynamic";

export default async function HostAutopilotPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/host/autopilot");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, _count: { select: { shortTermListings: true } } },
  });
  if (!user) redirect("/auth/login");

  const isHostish = user.role === "HOST" || user.role === "ADMIN" || user._count.shortTermListings > 0;
  if (!isHostish) redirect("/dashboard");

  const settings = await getHostAutopilotConfig(userId);

  const [actions, recommendations, approvals] = await Promise.all([
    prisma.managerAiActionLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        actionKey: true,
        targetEntityType: true,
        targetEntityId: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.managerAiRecommendation.findMany({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        agentKey: true,
        title: true,
        description: true,
        targetEntityType: true,
        targetEntityId: true,
        createdAt: true,
      },
    }),
    prisma.managerAiApprovalRequest.findMany({
      where: { requesterId: userId, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        actionKey: true,
        targetEntityType: true,
        targetEntityId: true,
        createdAt: true,
        payload: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/dashboard/host" className="text-sm text-amber-500/90 hover:text-amber-400">
            ← Host hub
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-white">AI Autopilot</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            LECIPM Manager can monitor listings and bookings, draft messages, and suggest pricing — with your mode and
            toggles. Refunds, payouts, and legal steps are never executed automatically.
          </p>
        </div>
      </div>

      <HostAutopilotClient
        initialSettings={{
          autopilotEnabled: settings.autopilotEnabled,
          autopilotMode: settings.autopilotMode,
          preferences: settings.preferences,
          lastAutopilotRunAt: settings.lastAutopilotRunAt?.toISOString() ?? null,
          guestMessaging: settings.guestMessaging,
        }}
        initialActions={actions.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        }))}
        initialRecommendations={recommendations}
        initialApprovals={approvals}
      />
    </div>
  );
}
