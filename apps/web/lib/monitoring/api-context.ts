import { prisma } from "@/lib/db";
import { monitoringOwner, type MonitoringOwner } from "@/lib/monitoring/resolve-owner";
import { requireUser } from "@/modules/security/access-guard.service";

export type MonitoringContextFailure = { ok: false; response: Response };
export type MonitoringContextOk = { ok: true; userId: string; owner: MonitoringOwner };
export type MonitoringContextResult = MonitoringContextFailure | MonitoringContextOk;

export async function requireMonitoringContext(): Promise<MonitoringContextResult> {
  const auth = await requireUser();
  if (!auth.ok) {
    return { ok: false, response: auth.response };
  }
  const u = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  const owner = monitoringOwner(auth.userId, u?.role ?? null);
  return { ok: true, userId: auth.userId, owner };
}
