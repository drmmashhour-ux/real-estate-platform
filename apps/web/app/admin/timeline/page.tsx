import Link from "next/link";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";

import { redirect } from "next/navigation";
import { HubLayout } from "@/components/hub/HubLayout";

import { prisma } from "@/lib/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { AdminAuditTimelinesPanel } from "../immo-logs/AdminAuditTimelinesPanel";
import { getAdminMovementMonitor } from "@/lib/admin/admin-movement-monitor";
import { AdminMovementAssistantPanel } from "@/components/admin/AdminMovementAssistantPanel";

export const dynamic = "force-dynamic";

export default async function AdminGlobalTimelinePage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?next=/admin/timeline");
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/dashboard");
  const role = await getUserRole();
  const movementMonitor = await getAdminMovementMonitor();

  return (
    <HubLayout title="Global timeline" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link href="/admin/dashboard" className="text-sm text-premium-gold hover:underline">
            ← Control center
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-white">Unified audit timeline</h1>
          <p className="mt-1 text-sm text-slate-400">
            Load full history for an FSBO listing, BNHub booking, contract, dispute, or user. Uses the same timeline
            component as operational reviews.
          </p>
        </div>
        <AdminMovementAssistantPanel
          last24h={movementMonitor.last24h}
          priorityFeed={movementMonitor.priorityFeed}
          aiSummary={movementMonitor.aiSummary}
          lanes={movementMonitor.lanes}
        />
        <AdminAuditTimelinesPanel />
      </div>
    </HubLayout>
  );
}
